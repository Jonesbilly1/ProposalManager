﻿// Copyright(c) Microsoft Corporation. 
// All rights reserved.
//
// Licensed under the MIT license. See LICENSE file in the solution root folder for full license information

using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ApplicationCore.Models
{
    public class RegionModel
    {
        /// <summary>
        /// Region identifier
        /// </summary>
        /// <value>Unique ID to identify the model data</value>
        [JsonProperty("id", Order = 1)]
        public string Id { get; set; }

        /// <summary>
        /// Region display name
        /// </summary>
        [JsonProperty("name", Order = 2)]
        public string Name { get; set; }
    }
}
