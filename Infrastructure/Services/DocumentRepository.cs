﻿// Copyright(c) Microsoft Corporation. 
// All rights reserved.
//
// Licensed under the MIT license. See LICENSE file in the solution root folder for full license information

using ApplicationCore;
using ApplicationCore.Artifacts;
using ApplicationCore.Entities;
using ApplicationCore.Helpers;
using ApplicationCore.Helpers.Exceptions;
using ApplicationCore.Interfaces;
using ApplicationCore.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure.Services
{
    public class DocumentRepository : BaseArtifactFactory<Document>, IDocumentRepository
    {
        private readonly GraphSharePointAppService _graphSharePointAppService;
        private readonly IOpportunityRepository _opportunityRepository;
        private readonly IWordParser _wordParser;
        private readonly IPowerPointParser _powerPointParser;

        public DocumentRepository(
            ILogger<DocumentRepository> logger,
            IOptionsMonitor<AppOptions> appOptions,
            GraphSharePointAppService graphSharePointAppService,
            IOpportunityRepository opportunityRepository,
            IWordParser wordParser,
            IPowerPointParser powerPointParser) : base(logger, appOptions)
        {
            Guard.Against.Null(graphSharePointAppService, nameof(graphSharePointAppService));
            Guard.Against.Null(opportunityRepository, nameof(opportunityRepository));
            Guard.Against.Null(wordParser, nameof(wordParser));
            Guard.Against.Null(powerPointParser, nameof(powerPointParser));

            _graphSharePointAppService = graphSharePointAppService;
            _opportunityRepository = opportunityRepository;
            _wordParser = wordParser;
            _powerPointParser = powerPointParser;
        }

        public async Task<JObject> UploadDocumentAsync(string siteId, string folder, IFormFile file, string requestId = "")
        {
            _logger.LogInformation($"RequestId: {requestId} - UploadDocumentAsync called.");

            try
            {
                Guard.Against.NullOrEmpty(siteId, nameof(siteId), requestId);
                Guard.Against.NullOrEmpty(folder, nameof(folder), requestId);
                Guard.Against.Null(file, nameof(file), requestId);

                return await _graphSharePointAppService.UploadFileAsync(siteId, folder, file, requestId);

            }
            catch (Exception ex)
            {
                _logger.LogError($"RequestId: {requestId} - UploadDocumentAsync Service Exception: {ex}");
                throw new ResponseException($"RequestId: {requestId} - UploadDocumentAsync Service Exception: {ex}");
            }
        }

        public async Task<JObject> UploadDocumentTeamAsync(string opportunityName, string docType, IFormFile file, string requestId = "")
        {
            _logger.LogInformation($"RequestId: {requestId} - UploadDocumentTeamAsync called.");

            try
            {
                Guard.Against.NullOrEmpty(opportunityName, nameof(opportunityName), requestId);
                Guard.Against.NullOrEmpty(docType, nameof(docType), requestId);
                Guard.Against.Null(file, nameof(file), requestId);

                var sections = new List<DocumentSection>();
                var folder = String.Empty;
                var docTypeParts = docType.Split(new char[] { ',', '=' }); //0 = ChecklistDocument, 1 = channle name, 2 = Checklist item Id


                if (docType == DocumentContext.ProposalTemplate.Name)
                {
                    // If docType is proposal document template, try to extract sections before upload so if fails, upload is skipped
                    sections = (ExtractSections(file.OpenReadStream(), file.FileName, requestId)).ToList();
                    Guard.Against.Null(sections, "UploadDocumentTeamAsync_sections", requestId);

                    folder = "Formal Proposal";
                }
                else if (docType == DocumentContext.Attachment.Name)
                {
                    folder = "TempFolder";
                }
                else
                {
                    folder = docTypeParts[1].Replace(" ", "");
                }


                // Get opportunity to update the associated docUri
                //var opportunity = Opportunity.Empty;
                var opportunity = await _opportunityRepository.GetItemByNameAsync($"'{opportunityName}'", false, requestId);
                Guard.Against.Null(opportunity, "UploadDocumentTeamAsync_GetItemByNameAsync", requestId);

                // Start a simple retry
                var retryGetOpTimes = 1;
                while ((String.IsNullOrEmpty(opportunity.Id)) && retryGetOpTimes < 7)
                {
                    _logger.LogInformation($"RequestId: {requestId} - UploadDocumentTeamAsync get opportunity delay started: {retryGetOpTimes} at {DateTime.Now}.");
                    await Task.Delay(4000 + (retryGetOpTimes * 1000));
                    opportunity = await _opportunityRepository.GetItemByNameAsync($"'{opportunityName}'", false, requestId);
                    retryGetOpTimes = retryGetOpTimes + 1;
                }

                Guard.Against.NullOrEmpty(opportunity.Id, "UploadDocumentTeamAsync_opportunity_GetItemByNameAsync", requestId);

                if (opportunity.DisplayName != opportunityName)
                {
                    throw new ResponseException($"RequestId: {requestId} - UploadDocumentTeamAsync GetItemByNameAsync mistmatch for opportunity: {opportunityName}");
                }

                var siteName = opportunityName.Replace(" ", "");
                var siteIdResponse = new JObject();
                var siteId = String.Empty;

                if (folder == "TempFolder")
                {
                    // Initial attachment is uploaded to private site for proposal mnagement
                    siteName = "ProposlManagement";
                    siteId = _appOptions.ProposalManagementRootSiteId;
                }
                else
                {
                    try
                    {
                        siteIdResponse = await _graphSharePointAppService.GetSiteIdAsync(_appOptions.SharePointHostName, siteName, requestId);
                        dynamic responseDyn = siteIdResponse;
                        siteId = responseDyn.id.ToString();
                    }
                    catch (Exception ex)
                    {
                        _logger.LogInformation($"RequestId: {requestId} - UploadDocumentTeamAsync get site id error: {ex}");
                    }
                }

                var retryGetSiteTimes = 1;
                while ((String.IsNullOrEmpty(siteId)) && retryGetSiteTimes < 4)
                {
                    _logger.LogInformation($"RequestId: {requestId} - UploadDocumentTeamAsync get site id delay started: {retryGetOpTimes} at {DateTime.Now}.");
                    await Task.Delay(4000 + (retryGetSiteTimes * 1000));
                    siteIdResponse = await _graphSharePointAppService.GetSiteIdAsync(_appOptions.SharePointHostName, siteName, requestId);
                    dynamic responseDyn = siteIdResponse;
                    siteId = responseDyn.id.ToString();
                    retryGetSiteTimes = retryGetSiteTimes + 1;
                }

                Guard.Against.NullOrEmpty(siteId, "UploadDocumentTeamAsync_GetSiteIdAsync", requestId);

                if (docType == DocumentContext.Attachment.Name)
                {
                    // Create folder with opportunity name in internal sharepoint under root\TempFolder TODO: Get name form app settings P2
                    try
                    {
                        var respFolder = await CreateFolderAsync(siteId, opportunity.DisplayName, folder, requestId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"RequestId: {requestId} - UploadDocumentTeamAsync CreateFolderAsync Exception: {ex}");
                    }

                    folder = folder + $"/{opportunity.DisplayName}";
                }

                var respUpload = await UploadDocumentAsync(siteId, folder, file, requestId);
                dynamic respUploadDyn = respUpload;
                string webUrl = respUploadDyn.webUrl.ToString();
                string docId = respUploadDyn.id.ToString();

                //Todo: Granular Premission
                if (docType == DocumentContext.ProposalTemplate.Name)
                {
                    // If docType is proposal document template, update sections & documentUri
                    opportunity.Content.ProposalDocument.Content.ProposalSectionList = sections;
                    opportunity.Content.ProposalDocument.Id = docId;
                    opportunity.Content.ProposalDocument.Metadata.DocumentUri = webUrl;
                }
                else if (docType == DocumentContext.Attachment.Name)
                {
                    if (opportunity.DocumentAttachments == null) opportunity.DocumentAttachments = new List<DocumentAttachment>();
                    var updDocumentAttachments = new List<DocumentAttachment>();
                    foreach (var itm in opportunity.DocumentAttachments)
                    {
                        var doc = itm;
                        if (itm.FileName == file.FileName)
                        {
                            doc.Id = docId;
                            doc.FileName = file.FileName;
                            doc.Note = itm.Note ?? String.Empty;
                            doc.Tags = itm.Tags ?? String.Empty;
                            doc.DocumentUri = "TempFolder";
                            doc.Category = Category.Empty;
                            doc.Category.Id = itm.Category.Id;
                            doc.Category.Name = itm.Category.Name;
                        }
                        updDocumentAttachments.Add(doc);
                    }
                    opportunity.DocumentAttachments = updDocumentAttachments;
                }
                else if (docType.StartsWith($"{DocumentContext.ChecklistDocument.Name}="))
                {
                    var checklistTaskId = docTypeParts[2];
                    var channel = docTypeParts[1];

                    var newChecklists = new List<Checklist>();
                    foreach (var item in opportunity.Content.Checklists.ToList())
                    {
                        var newChecklist = new Checklist();
                        newChecklist.ChecklistTaskList = new List<ChecklistTask>();
                        newChecklist.ChecklistChannel = item.ChecklistChannel;
                        newChecklist.ChecklistStatus = item.ChecklistStatus;
                        newChecklist.Id = item.Id;

                        if (channel != item.ChecklistChannel)
                        {
                            newChecklist.ChecklistTaskList = item.ChecklistTaskList;
                        }
                        else
                        {
                            var newChecklistTask = new ChecklistTask();
                            foreach (var sItem in item.ChecklistTaskList)
                            {
                                if (sItem.Id == checklistTaskId)
                                {
                                    newChecklistTask.Id = sItem.Id;
                                    newChecklistTask.ChecklistItem = sItem.ChecklistItem;
                                    newChecklistTask.Completed = sItem.Completed;
                                    newChecklistTask.FileUri = webUrl;
                                    newChecklist.ChecklistTaskList.Add(newChecklistTask);
                                }
                                else
                                {
                                    newChecklist.ChecklistTaskList.Add(sItem);
                                }
                            }
                        }

                        newChecklists.Add(newChecklist);
                    }
                    opportunity.Content.Checklists = newChecklists;
                }

                // Update the opportunity
                var respUpdate = await _opportunityRepository.UpdateItemAsync(opportunity, requestId);
                Guard.Against.NotStatus200OK(respUpdate, "UploadDocumentTeamAsync_UpdateItemAsync", requestId);

                return respUpload;
            }
            catch (Exception ex)
            {
                _logger.LogError($"RequestId: {requestId} - UploadDocumentTeamAsync Service Exception: {ex}");
                throw new ResponseException($"RequestId: {requestId} - UploadDocumentTeamAsync Service Exception: {ex}");
            }
        }


        // Private methods
        private IList<DocumentSection> ExtractSections(Stream fileStream, string fileName, string requestId = "")
        {
            _logger.LogInformation($"RequestId: {requestId} - GetItemByIdAsync called.");

            try
            {
                if (fileName.Contains(".pptx"))
                {
                    return _powerPointParser.RetrieveTOC(fileStream);
                }
                else
                {
                    return _wordParser.RetrieveTOC(fileStream);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"RequestId: {requestId} - ExtractSectionsAsync Service Exception: {ex}");
                throw new ResponseException($"RequestId: {requestId} - ExtractSectionsAsync Service Exception: {ex}");
            }
        }

        private async Task<JObject> CreateFolderAsync(string siteId, string folderName, string path, string requestId = "")
        {
            _logger.LogInformation($"RequestId: {requestId} - CreateFolderAsync called.");

            try
            {
                Guard.Against.NullOrEmpty(siteId, nameof(siteId), requestId);
                Guard.Against.NullOrEmpty(folderName, nameof(folderName), requestId);
                Guard.Against.Null(path, nameof(path), requestId);

                return await _graphSharePointAppService.CreateFolderAsync(siteId, folderName, path, requestId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"RequestId: {requestId} - CreateFolderAsync Service Exception: {ex}");
                throw new ResponseException($"RequestId: {requestId} - CreateFolderAsync Service Exception: {ex}");
            }
        }

        public async Task<JObject> CreateTempFolderAsync(string siteId, string folderName, string requestId = "")
        {
            _logger.LogInformation($"RequestId: {requestId} - CreateFolderAsync called.");

            try
            {
                Guard.Against.NullOrEmpty(siteId, nameof(siteId), requestId);
                Guard.Against.NullOrEmpty(folderName, nameof(folderName), requestId);

                return await _graphSharePointAppService.CreateTempFolderAsync(siteId, folderName, requestId);
            }
            catch (Exception ex)
            {
                _logger.LogError($"RequestId: {requestId} - CreateFolderAsync Service Exception: {ex}");
                throw new ResponseException($"RequestId: {requestId} - CreateFolderAsync Service Exception: {ex}");
            }
        }

        private async Task<JObject> DeleteFileOrFolderAsync(string siteId, string itemPath, string requestId = "")
        {
            _logger.LogInformation($"RequestId: {requestId} - DeleteFileOrFolderAsync called.");

            try
            {
                Guard.Against.NullOrEmpty(siteId, nameof(siteId), requestId);
                Guard.Against.NullOrEmpty(itemPath, nameof(itemPath), requestId);

                return await _graphSharePointAppService.DeleteFileOrFolderAsync(siteId, itemPath, requestId);

            }
            catch (Exception ex)
            {
                _logger.LogError($"RequestId: {requestId} - DeleteFileOrFolderAsync Service Exception: {ex}");
                throw new ResponseException($"RequestId: {requestId} - DeleteFileOrFolderAsync Service Exception: {ex}");
            }
        }

        private async Task<JObject> MoveFileAsync(string fromSiteId, string fromItemPath, string toSiteId, string toItemPath, string requestId = "")
        {
            _logger.LogInformation($"RequestId: {requestId} - MoveFileAsync called.");

            try
            {
                Guard.Against.NullOrEmpty(fromSiteId, nameof(fromSiteId), requestId);
                Guard.Against.NullOrEmpty(fromItemPath, nameof(fromItemPath), requestId);
                Guard.Against.NullOrEmpty(toSiteId, nameof(toSiteId), requestId);
                Guard.Against.NullOrEmpty(toItemPath, nameof(toItemPath), requestId);

                return await _graphSharePointAppService.MoveFileAsync(fromSiteId, fromItemPath, toSiteId, toItemPath, requestId);

            }
            catch (Exception ex)
            {
                _logger.LogError($"RequestId: {requestId} - MoveFileAsync Service Exception: {ex}");
                throw new ResponseException($"RequestId: {requestId} - MoveFileAsync Service Exception: {ex}");
            }
        }
    }
}
