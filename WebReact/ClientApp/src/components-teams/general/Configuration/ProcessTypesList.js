﻿/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/

import React, { Component } from 'react';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { IconButton } from 'office-ui-fabric-react/lib/Button';
import { DetailsList, DetailsListLayoutMode, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { Link } from 'office-ui-fabric-react/lib/Link';
import Utils from '../../../helpers/Utils';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Trans } from "react-i18next";
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';

export class ProcessTypesList extends Component {
    displayName = ProcessTypesList.name

    constructor(props) {
        super(props);
        this.utils = new Utils();
        this.authHelper = window.authHelper;
        this.schema = {
            "id": "",
            "processStep": "",
            "channel": "",
            "processType": "",
            "roleName": "",
            "roleId": "",
            "isDisable": false
        };

        const columns = [
            {
                key: 'column1',
                name: <Trans>Process Step</Trans>,
                headerClassName: 'ms-List-th browsebutton',
                className: 'docs-TextFieldExample ms-Grid-col ms-sm12 ms-md12 ms-lg8',
                fieldName: 'processStep',
                minWidth: 150,
                maxWidth: 250,
                isRowHeader: true,
                onRender: (item) => {
                    return (
                        <TextField
                            id={'txtProcessStep' + item.id}
                            value={item.processStep}
                            onBlur={(e) => this.onChangeProperty(e, item, "processStep")}
                            disabled={item.isDisable}
                        />
                    );
                }
            },
            {
                key: 'column2',
                name: <Trans>Role Name</Trans>,
                headerClassName: 'ms-List-th browsebutton',
                className: 'docs-TextFieldExample ms-Grid-col ms-sm12 ms-md12 ms-lg8',
                fieldName: 'roleName',
                minWidth: 150,
                maxWidth: 300,
                isRowHeader: true,
                onRender: (item) => {
                    //console.log("Permissions_onrender item : ",item)
                    return (
                        <div className="docs-DropdownExample">
                            <Dropdown
                                id={'txtRoleName' + item.id}
                                ariaLabel='Role Name'
                                options={this.state.rolesList}
                                defaultSelectedKey={item.roleId}
                                onChanged={(e) => this.onChangeProperty(e, item, "roleName")}
                                disabled={item.isDisable}
                            />
                        </div>
                    );
                }
            },
            {
                key: 'column3',
                name: <Trans>Process Type</Trans>,
                headerClassName: 'ms-List-th browsebutton',
                className: 'docs-TextFieldExample ms-Grid-col ms-sm12 ms-md12 ms-lg8',
                fieldName: 'processType',
                minWidth: 150,
                maxWidth: 300,
                isRowHeader: true,
                onRender: (item) => {
                    // console.log("ProcessTypeList_log item : ",item)
                    return (
                        <div className="docs-DropdownExample">
                            <Dropdown
                                id={'txtProcessTYpe' + item.id}
                                ariaLabel='Process Type'
                                options={[
                                    { key: "Base", text: 'Base' },
                                    { key: "None", text: 'None' },
                                    { key: "CheckListTab", text: 'CheckListTab' },
                                    { key: "customerDecisionTab", text: 'customerDecisionTab' },
                                    { key: "proposalStatusTab", text: 'proposalStatusTab' }
                                ]}
                                defaultSelectedKey={item.processType}
                                onChanged={(e) => this.onChangeProperty(e, item, "processType")}
                                disabled={item.isDisable}
                            />
                        </div>
                    );
                }
            },
            {
                key: 'column4',
                name: <Trans>actions</Trans>,
                headerClassName: 'ms-List-th',
                className: 'ms-Grid-col ms-sm12 ms-md12 ms-lg4',
                minWidth: 16,
                maxWidth: 16,
                onRender: (item) => {
                    return (
                        <div>
                            <IconButton iconProps={{ iconName: 'Save' }} onClick={e => this.addRow(item)} disabled={item.isDisable} />&nbsp;&nbsp;&nbsp;
                            <IconButton iconProps={{ iconName: 'Delete' }} onClick={e => this.deleteRow(item)} disabled={item.isDisable} />
                        </div>
                    );
                }
            }
        ];

        this.state = {
            items: [],
            columns: columns,
            loading: true,
            isUpdate: false,
            MessagebarText: "",
            MessageBarType: MessageBarType.success,
            isUpdateMsg: false,
            item: this.schema,
            rolesList: []
        };
    }

    async componentDidMount() {
        await this.getProcessRolesList();
        await this.getProcessTypeList();
    }

    async getProcessTypeList() {
        let items = this.state.items, loading = true;
        try {
            let requestUrl = 'api/Process';
            let response = await fetch(requestUrl, {
                method: "GET",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'authorization': 'Bearer ' + this.authHelper.getWebApiToken()
                }
            });
            let data = await this.utils.handleErrors(response).json();
            this.setState({
                items: data
            });
            let processTypes = data.itemsList;
            items = processTypes.map(process => {
                let displayProcess = process.processType.toLowerCase();
                let isDisable = displayProcess === 'base' || displayProcess === 'customerdecisiontab' || displayProcess === 'proposalstatustab' ? true : false;
                return {
                    "id": process.id,
                    "processStep": process.processStep,
                    "channel": process.channel,
                    "roleId": process.roleId,
                    "roleName": process.roleName,
                    "processType": process.processType,
                    "isDisable": isDisable
                };
            });
            loading = false;
        } catch (error) {
            loading = false;
            this.setMessage(false, true, MessageBarType.error, error.message);
        } finally {

            console.log("ProcessTypeList_log getProcessTypeList ", items);
            this.setState({ items, loading });
        }
    }

    async getProcessRolesList() {
        let loading = true;
        try {
            let requestUrl = 'api/Context/GetProcessRolesList';
            let response = await fetch(requestUrl, {
                method: "GET",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'authorization': 'Bearer ' + this.authHelper.getWebApiToken()
                }
            });
            let rolesList = await this.utils.handleErrors(response).json();
            rolesList = rolesList.map(role => { return { "key": role.key, "text": role.roleName } });
            console.log("ProcessTypeList_log getProcessRolesList ", rolesList);
            this.setState({ rolesList });
        } catch (error) {
            this.setMessage(false, true, MessageBarType.error, error.message);
        } finally {
            this.setState({ loading });
        }
    }

    onAddRow() {
        let newItems = [];
        newItems.push(this.createRowItem());

        let currentItems = this.state.items.concat(newItems);

        this.setState({
            items: currentItems
        });
    }

    checkProcessTypeIsAlreadyPresent(item) {
        let flag = false;
        let items = this.state.items.slice(0);
        console.log(items.filter(process => process.id.length > 0));
        let index = items.filter(process => process.id.length > 0).findIndex(process => process.processStep.toLowerCase() === item.processStep.toLowerCase() && process.id !== item.id);
        console.log("ProcessTypeList_log checkProcessTypeIsAlreadyPresent : ", item.processStep, index);
        if (index !== -1) {
            this.setState({
                isUpdate: false,
                isUpdateMsg: true,
                MessagebarText: <Trans>processTypeAlreadyExist</Trans>,
                MessageBarType: MessageBarType.error
            });
            setTimeout(function () {
                this.setMessage(false, false, "", "");
                this.setState({ items });
            }.bind(this), 2000);
            flag = true;
        }
        return flag;
    }

    processTypeList(columns, isCompactMode, items) {
        return (
            <div className='ms-Grid-row LsitBoxAlign p20ALL'>
                <DetailsList
                    items={items}
                    compact={isCompactMode}
                    columns={columns}
                    selectionMode={SelectionMode.none}
                    selectionPreservedOnEmptyClick='true'
                    setKey='set'
                    layoutMode={DetailsListLayoutMode.justified}
                    enterModalSelectionOnTouch='false'
                />
            </div>
        );
    }

    setMessage(isUpdate, isUpdateMsg, MessageBarType, MessagebarText) {
        this.setState({ isUpdate, isUpdateMsg, MessageBarType, MessagebarText });
    }



    async addRow(item) {
        console.log("ProcessTypeList_log : addRow ", item);
        if (item.id.length === 0) {
            await this.addOrUpdateProcess(item, "POST");
        } else if (item.id.length > 0) {
            await this.addOrUpdateProcess(item, "PATCH");
        }
    }

    onChangeProperty(e, item, property) {

        let items = JSON.parse(JSON.stringify(this.state.items));
        let updatedItem = item.id.length === 0 ? JSON.parse(JSON.stringify(this.state.item)) : item;
        let changeFlag = false;
        console.log("ProcessTypeList_log : item ", item, e.target, e.text);

        switch (property) {
            case "processStep":
                if (e.target.value) {
                    updatedItem.processStep = e.target.value;
                    updatedItem.channel = e.target.value;
                    changeFlag = true;
                }
                break;
            case "processType":
                if (e.text) {
                    updatedItem.processType = e.text;
                    changeFlag = true;
                }
                break;
            case "roleName":
                if (e.text) {
                    updatedItem.roleName = e.text;
                    updatedItem.roleId = e.key;
                    changeFlag = true;
                }
                break;
        }

        if (changeFlag) {
            if (item.id.length === 0) {
                items[items.length - 1] = updatedItem;
            } else {
                let index = items.findIndex(obj => obj.id === item.id);
                if (index !== -1) {
                    items[index] = updatedItem;
                }
            }

            console.log("ProcessTypeList_log : updatedItem ", updatedItem);
            console.log("ProcessTypeList_log : items ", items);

            this.setState({ item: updatedItem, items });
        }
    }

    async addOrUpdateProcess(item, methodType) {
        this.setState({ isUpdate: true });


        try {
            //Checking item is already present
            if (this.checkProcessTypeIsAlreadyPresent(item)) return;

            let options = {
                method: methodType,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'authorization': 'Bearer    ' + window.authHelper.getWebApiToken()
                },
                body: JSON.stringify(item)
            };
            this.utils.handleErrors(await fetch("api/Process", options));
            this.setMessage(false, true, MessageBarType.success, methodType === "PATCH" ? <Trans>processTypeUpdatedSuccess</Trans> : <Trans>processTypeAddSuccess</Trans>);
        } catch (error) {
            this.setMessage(false, true, MessageBarType.error, <Trans>errorOoccuredPleaseTryAgain</Trans> + " " + error.message);
        } finally {
            setTimeout(function () { this.setMessage(false, false, "", ""); }.bind(this), 2000);
            this.setState({ item: this.schema });
            await this.getProcessTypeList();
        }
    }

    async deleteRow(processTypeItem) {
        this.setState({ isUpdate: true });
        let requestUpdUrl = 'api/Process/' + processTypeItem.id;
        try {
            let response = await fetch(requestUpdUrl, {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                method: "DELETE",
                headers: { 'authorization': 'Bearer ' + this.authHelper.getWebApiToken() }
            });
            this.utils.handleErrors(response);
            this.setMessage(false, true, MessageBarType.success, <Trans>processTypeDeletedSuccess</Trans>);
        } catch (error) {
            this.setMessage(false, true, MessageBarType.error, <Trans>errorOoccuredPleaseTryAgain</Trans> + " " + error.message);
        } finally {
            setTimeout(function () { this.setMessage(false, false, "", ""); }.bind(this), 2000);
            await this.getProcessTypeList();
        }
        return;
    }

    createRowItem() {
        return this.schema
    }

    render() {
        const { columns, items } = this.state;
        const processTypeList = this.processTypeList(columns, false, items);
        if (this.state.loading) {
            return (
                <div className='ms-BasicSpinnersExample ibox-content pt15 '>
                    <Spinner size={SpinnerSize.large} label={<Trans>loading</Trans>} ariaLive='assertive' />
                </div>
            );
        } else {
            return (

                <div className='ms-Grid bg-white ibox-content'>

                    <div className='ms-Grid-row'>
                        <div className='ms-Grid-col ms-sm12 ms-md12 ms-lg12'>
                            <div className='ms-Grid-col ms-sm12 ms-md12 ms-lg12 pt10'>
                                <Link href='' className='pull-left' onClick={() => this.onAddRow()} >+ <Trans>Add New Row</Trans></Link>
                            </div>
                            {processTypeList}
                        </div>
                    </div>
                    <div className='ms-Grid-row'>
                        <div className='ms-Grid-col ms-sm12 ms-md12 ms-lg12'>
                            <div className='ms-BasicSpinnersExample p-10'>
                                {
                                    this.state.isUpdate ?
                                        <Spinner size={SpinnerSize.large} ariaLive='assertive' />
                                        : ""
                                }
                                {
                                    this.state.isUpdateMsg ?
                                        <MessageBar
                                            messageBarType={this.state.MessageBarType}
                                            isMultiline={false}
                                        >
                                            {this.state.MessagebarText}
                                        </MessageBar>
                                        : ""
                                }
                            </div>
                        </div>
                    </div>
                </div>
            );

        }
    }

}