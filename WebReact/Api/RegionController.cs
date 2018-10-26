﻿// Copyright(c) Microsoft Corporation. 
// All rights reserved.
//
// Licensed under the MIT license. See LICENSE file in the solution root folder for full license information

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ApplicationCore;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ApplicationCore.Interfaces;
using ApplicationCore.Helpers;
using ApplicationCore.Artifacts;
using Newtonsoft.Json.Linq;
using ApplicationCore.ViewModels;
using ApplicationCore.Models;
using Newtonsoft.Json;
using Microsoft.AspNetCore.Authorization;

namespace WebReact.Api
{
    [Authorize(AuthenticationSchemes = "AzureAdBearer")]
    public class RegionController : BaseApiController<RegionController>
    {
        private readonly IRegionService _regionService;

        public RegionController(
            ILogger<RegionController> logger, 
            IOptions<AppOptions> appOptions,
            IRegionService regionService) : base(logger, appOptions)
        {
            Guard.Against.Null(regionService, nameof(regionService));
            _regionService = regionService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] JObject jsonObject)
        {
            var requestId = Guid.NewGuid().ToString();
            _logger.LogInformation($"RequestID:{requestId} - Region_Create called.");

            try
            {
                if (jsonObject == null)
                {
                    _logger.LogError($"RequestID:{requestId} - Region_Create error: null");
                    var errorResponse = JsonErrorResponse.BadRequest($"Region_Create error: null", requestId);

                    return BadRequest(errorResponse);
                }

                var modelObject = JsonConvert.DeserializeObject<RegionModel>(jsonObject.ToString(), new JsonSerializerSettings
                {
                    MissingMemberHandling = MissingMemberHandling.Ignore,
                    NullValueHandling = NullValueHandling.Ignore
                });

                //TODO: P2 Refactor into Guard
                if (String.IsNullOrEmpty(modelObject.Name))
                {
                    _logger.LogError($"RequestID:{requestId} - Region_Create error: invalid name");
                    var errorResponse = JsonErrorResponse.BadRequest($"Region_Create error: invalid name", requestId);

                    return BadRequest(errorResponse);
                }

                var resultCode = await _regionService.CreateItemAsync(modelObject, requestId);

                if (resultCode != ApplicationCore.StatusCodes.Status201Created)
                {
                    _logger.LogError($"RequestID:{requestId} - Region_Create error: {resultCode.Name}");
                    var errorResponse = JsonErrorResponse.BadRequest($"Region_Create error: {resultCode.Name}", requestId);

                    return BadRequest(errorResponse);
                }

                var location = "/Region/Create/new"; // TODO: Get the id from the results but need to wire from factory to here

                return Created(location, $"RequestId: {requestId} - Region created.");
            }
            catch (Exception ex)
            {
                _logger.LogError($"RequestID:{requestId} Region_Create error: {ex.Message}");
                var errorResponse = JsonErrorResponse.BadRequest($"Region_Create error: {ex} ", requestId);

                return BadRequest(errorResponse);
            }
        }

        [HttpPatch]
        public async Task<IActionResult> Update([FromBody] JObject jsonObject)
        {
            var requestId = Guid.NewGuid().ToString();
            _logger.LogInformation($"RequestID:{requestId} - Region_Update called.");

            try
            {
                if (jsonObject == null)
                {
                    _logger.LogError($"RequestID:{requestId} - Region_Update error: null");
                    var errorResponse = JsonErrorResponse.BadRequest($"Region_Update error: null", requestId);

                    return BadRequest(errorResponse);
                }

                var modelObject = JsonConvert.DeserializeObject<RegionModel>(jsonObject.ToString(), new JsonSerializerSettings
                {
                    MissingMemberHandling = MissingMemberHandling.Ignore,
                    NullValueHandling = NullValueHandling.Ignore
                });

                //TODO: P2 Refactor into Guard
                if (String.IsNullOrEmpty(modelObject.Id))
                {
                    _logger.LogError($"RequestID:{requestId} - Region_Update error: invalid id");
                    var errorResponse = JsonErrorResponse.BadRequest($"Region_Update error: invalid id", requestId);

                    return BadRequest(errorResponse);
                }

                var resultCode = await _regionService.UpdateItemAsync(modelObject, requestId);

                if (resultCode != ApplicationCore.StatusCodes.Status200OK)
                {
                    _logger.LogError($"RequestID:{requestId} - Region_Update error: {resultCode.Name}");
                    var errorResponse = JsonErrorResponse.BadRequest($"Region_Update error: {resultCode.Name} ", requestId);

                    return BadRequest(errorResponse);
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"RequestID:{requestId} - Region_Update error: {ex.Message}");
                var errorResponse = JsonErrorResponse.BadRequest($"Region_Update error: {ex.Message} ", requestId);

                return BadRequest(errorResponse);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var requestId = Guid.NewGuid().ToString();
            _logger.LogInformation($"RequestID:{requestId} - Region_Delete called.");

            if (String.IsNullOrEmpty(id))
            {
                _logger.LogError($"RequestID:{requestId} - Region_Delete id == null.");
                return NotFound($"RequestID:{requestId} - Region_Delete Null ID passed");
            }

            var resultCode = await _regionService.DeleteItemAsync(id, requestId);

            if (resultCode != ApplicationCore.StatusCodes.Status204NoContent)
            {
                _logger.LogError($"RequestID:{requestId} - Region_Delete error: " + resultCode);
                var errorResponse = JsonErrorResponse.BadRequest($"Region_Delete error: {resultCode.Name} ", requestId);

                return BadRequest(errorResponse);
            }

            return NoContent();
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var requestId = Guid.NewGuid().ToString();
            _logger.LogInformation($"RequestID:{requestId} - Region_GetAll called.");

            try
            {
                var modelList = (await _regionService.GetAllAsync(requestId)).ToList();
                Guard.Against.Null(modelList, nameof(modelList), requestId);

                if (modelList.Count == 0)
                {
                    _logger.LogError($"RequestID:{requestId} - Region_GetAll no items found.");
                    return NotFound($"RequestID:{requestId} - Region_GetAll no items found");
                }

                return Ok(modelList);
            }
            catch (Exception ex)
            {
                _logger.LogError($"RequestID:{requestId} - Region_GetAll error: {ex.Message}");
                var errorResponse = JsonErrorResponse.BadRequest($"Region_GetAll error: {ex.Message} ", requestId);

                return BadRequest(errorResponse);
            }
        }
    }
}
