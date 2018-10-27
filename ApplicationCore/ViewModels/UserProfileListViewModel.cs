﻿// Copyright(c) Microsoft Corporation. 
// All rights reserved.
//
// Licensed under the MIT license. See LICENSE file in the solution root folder for full license information

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ApplicationCore;
using ApplicationCore.Artifacts;
using ApplicationCore.Entities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ApplicationCore.ViewModels
{
    public class UserProfileListViewModel : BaseListViewModel<UserProfileViewModel>
    {
        public UserProfileListViewModel() : base()
        {
        }
    }
}
