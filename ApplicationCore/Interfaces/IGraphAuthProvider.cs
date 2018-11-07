﻿// Copyright(c) Microsoft Corporation. 
// All rights reserved.
//
// Licensed under the MIT license. See LICENSE file in the solution root folder for full license information.


using System.Threading.Tasks;

namespace ApplicationCore.Interfaces
{
    /// <summary>
    /// Interface to abstract an Authentication Provider needed by Middle Tier components
    /// </summary>
    public interface IGraphAuthProvider
    {
        Task<string> GetUserAccessTokenAsync(string userId, bool appOnBehalf = false);

        Task<string> GetAppAccessTokenAsync();

        Task<string> SetOnBehalfAccessTokenAsync(string userId);
    }
}
