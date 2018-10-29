﻿// Copyright(c) Microsoft Corporation. 
// All rights reserved.
//
// Licensed under the MIT license. See LICENSE file in the solution root folder for full license information.

using System;
using System.Collections.Generic;
using System.Text;

namespace ApplicationCore
{
    /// <summary>
    /// Settings relative to the AzureAD applications involved in this Web Application
    /// These are deserialized from the AzureAD section of the appsettings.json file
    /// </summary>
    public class AppOptions
    {
        public string SharePointHostName { get; set; }

        public string ProposalManagementRootSiteId { get; set; }

        public string CategoriesListId { get; set; }

        public string TemplateListId { get; set; }

        public string RoleListId { get; set; }

        public string ProcessListId { get; set; }

        public string IndustryListId { get; set; }

        public string RegionsListId { get; set; }

        public string NotificationsListId { get; set; }

        public string RoleMappingsListId { get; set; }

        public string OpportunitiesListId { get; set; }

        public string PublicOpportunitiesListId { get; set; }

        public string SetupPage { get; set; }

        public string GraphRequestUrl { get; set; }

        public string GraphBetaRequestUrl { get; set; }

        public string ServiceEmail { get; set; }

        public int UserProfileCacheExpiration { get; set; }

        public string MicrosoftAppId { get; set; }

        public string MicrosoftAppPassword { get; set; }

        public string AllowedTenants { get; set; }

        public string BotServiceUrl { get; set; }

        public string BotName { get; set; }

        public string BotId { get; set; }

        public string TeamsAppInstanceId { get; set; }

        public string DashboardListId { get; set; }

        public string Permissions { get; set; }

		public string PBIUserName { get; set; }

		public string PBIUserPassword { get; set; }

		public string PBIApplicationId { get; set; }

		public string PBIWorkSpaceId { get; set; }

		public string PBIReportId { get; set; }

		public string PBITenantId { get; set; }

        public string GeneralProposalManagementTeam { get; set; }
        public string SharePointListsPrefix { get; set; }
        public string ProposalManagerAddInName { get; set; }
        public string ProposalManagerGroupID { get; set; }
        public string SharePointSiteRelativeName { get; set; }
    }
}
