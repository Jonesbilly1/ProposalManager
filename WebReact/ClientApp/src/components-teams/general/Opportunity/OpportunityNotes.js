﻿/* 
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. 
*  See LICENSE in the source repository root for complete license information. 
*/

import React, { Component } from 'react';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Glyphicon } from 'react-bootstrap';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import {
    Spinner,
    SpinnerSize
} from 'office-ui-fabric-react/lib/Spinner';
import { Trans } from "react-i18next";
import { TeamMembers } from './TeamMembers';


export class OpportunityNotes extends Component {
    displayName = OpportunityNotes.name

    constructor(props) {
        super(props);

        this.sdkHelper = window.sdkHelper;
        this.authHelper = window.authHelper;

        const userProfile = this.props.userProfile;

        const oppId = this.props.opportunityId;
        const opportunityData = this.props.opportunityData;


        this.state = {
            loading: true,
            NotesList: [],
            oppData: opportunityData,
            addNotes: '',
            teamMembers: [],
            oppId: oppId,
            newNotesLoading: false,
            MessagebarText: "",
            MessageBarType: "",
            isSendDisable: true,
            userRole: userProfile.role,
            userAssignedRole: "",
            userId: userProfile.id,
            isAuthenticated: false,
            isComponentDidUpdate: false

        };



        this.handleChangeNewNotes = this.handleChangeNewNotes.bind(this);
        this.fnSaveNewNotes = this.fnSaveNewNotes.bind(this);
    }

    async componentDidMount() {
        console.log("OpportunityDetails_componentWillMount isauth: " + this.authHelper.isAuthenticated() + " this.accessGranted: " + this.accessGranted);

        if (!this.state.isAuthenticated) {
            this.setState({
                isAuthenticated: this.authHelper.isAuthenticated()
            });
        }

    }

    async componentDidUpdate() {
        try {
            if (this.state.isAuthenticated && !this.state.isComponentDidUpdate && this.state.oppData) {
                console.log("OpportunityNotes_componentDidUpdate 1", this.state.loading, this.state.isComponentDidUpdate);
                let userProfile = await this.authHelper.callGetUserProfile();
                let value = await this.getOppDetails(userProfile);
            } else {
                if (!this.state.oppData) {
                    console.log("OpportunityNotes_componentDidUpdate 2", this.state.loading, this.state.isComponentDidUpdate);
                }
            }

        } catch (error) {
            console.log("OpportunitySummary_componentDidUpdate error : ", error);
        }

    }

    
    componentWillUnmount() {
        console.log("componentWillUnmount");
    }


    async getOppDetails(userDetails) {

        try {


            let data = this.state.oppData;
            if (data) {
                let teamMembers = [];
                teamMembers = data.teamMembers;

                let loanOfficerObj = teamMembers.filter(function (k) {
                    return k.assignedRole.displayName === "LoanOfficer";
                });

                let currentUserId = userDetails.id;
                let teamMemberLODetails = loanOfficerObj.filter(function (k) {
                    return k.id === currentUserId;
                });

                let userAssignedRole = teamMemberLODetails.length > 0 ? teamMemberLODetails[0].assignedRole.displayName : "";

                this.setState({
                    NotesList: data.notes,
                    loading: false,
                    teamMembers: teamMembers,
                    userAssignedRole: userAssignedRole,
                    userProfile: userDetails,
                    isComponentDidUpdate: true 
                });
            } else
                throw Error("Data is null");

        }
        catch (err) {
            console.log("Error");
            console.log(err);
        }

    }

    handleChangeNewNotes(value) {

        this.setState({
            isSendDisable: value.length > 0 ? false : true,
            addNotes: value
        });
    }

    fnSaveNewNotes() {
        let randomId = Math.random() * (10000000 - 8273) + 2323;
        this.setState({ newNotesLoading: true });
        let date = new Date().getDate();
        let month = new Date().getMonth() + 1;
        let year = new Date().getFullYear();
        let createdDate = month + '/' + date + '/' + year;
        let newNotesObj = { "id": randomId.toString(), "noteBody": this.state.addNotes, "createdDateTime": createdDate, "createdBy": {} };
        this.setState({
            isNewNote: true
        });
        let oppViewData = this.state.oppData;
        oppViewData.notes.push(newNotesObj);

        // API Update call        
        this.requestUrl = 'api/opportunity?id=' + this.state.oppId;
        let options = {
            method: "PATCH",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'authorization': 'Bearer    ' + window.authHelper.getWebApiToken()
            },
            body: JSON.stringify(oppViewData)
        };

        fetch(this.requestUrl, options)
            .catch(error => console.error('Error:', error))
            .then(response => {
                if (response.ok) {
                    return response.json;
                } else {
                    return false;
                }
            }).then(json => {
                if (!json) { //Error
                    oppViewData.notes.pop(newNotesObj);
                    this.setState({ isNewNote: false, newNoteMsg: true, MessagebarText: "Error while adding notes. Please try ", MessageBarType: MessageBarType.warning });
                    setTimeout(function () { this.setState({ newNoteMsg: false, MessagebarText: "", newNotesLoading: false, MessageBarType: "" }); }.bind(this), 3000);
                    this.setState({ addNotes: '' });
                } else { //Success
                    this.setState({ isNewNote: false, newNoteMsg: true, MessagebarText: "New Notes Added", MessageBarType: MessageBarType.success, isSendDisable: true });
                    setTimeout(function () { this.setState({ newNoteMsg: false, MessagebarText: "", newNotesLoading: false, MessageBarType: "" }); }.bind(this), 3000);
                    this.setState({ addNotes: '' });
                }
            });
    }

    static NotesListData(NotesList) {
        if (typeof NotesList === 'undefined' || NotesList === null || NotesList === "")
            return null;
        return (
            <div>
                {NotesList.map(note =>
                    note.noteBody !== "" ?
                        <div className='ms-Grid bg-grey ' key={note.id}>
                            <div className='ms-Grid-row p-5'>
                                <div className='ms-Grid-col ms-sm12 ms-md12 ms-lg12 bg-white'>
                                    <span className='pull-right'>{new Date(note.createdDateTime).getFullYear() === 1 || new Date(note.createdDateTime).getFullYear() === 0 ? new Date().toLocaleDateString() : new Date(note.createdDateTime).toLocaleDateString()}{}</span>
                                </div>
                                <div className='ms-Grid-col ms-sm12 ms-md12 ms-lg12 bg-white p15'>
                                    {note.noteBody}
                                </div>
                                <br />
                            </div>

                            <div className='ms-Grid bg-grey'>
                                <br />
                            </div>
                        </div> : ""
                )}
            </div>

        );
    }

    render() {
        const TeamMembersView = ({ match }) => {
            return (
                <TeamMembers
                    memberslist={this.state.oppData.teamMembers}
                    createTeamId={this.state.oppData.id}
                    opportunityName={this.state.oppData.displayName}
                    opportunityState={this.state.oppData.opportunityState}
                    userRole={this.state.userAssignedRole}
                />
            );
        };
        let newNotesLoading = this.state.newNotesLoading;
        let notes = this.state.loading ? <div className='bg-white'><p><em>Loading...</em></p></div>
            : OpportunityNotes.NotesListData(this.state.NotesList);
        if (this.state.loading) {
            return (
                <div className='ms-BasicSpinnersExample ibox-content pt15 '>
                    <Spinner size={SpinnerSize.large} label='loading...' ariaLive='assertive' />
                </div>
            );
        } else {
            return (
                <div className='ms-Grid'>
                    <div className='ms-Grid-row'>
                        <div className=' ms-Grid-col ms-sm12 ms-md12 ms-lg12 p-r-10 bg-grey'>
                            <div className='ms-Grid-row'>
                                <div className=' ms-Grid-col ms-sm12 ms-md12 ms-lg6 pageheading'>
                                    <h3><Trans>notes</Trans></h3>
                                </div>
                                <div className=' ms-Grid-col ms-sm12 ms-md12 ms-lg6'><br />

                                </div>
                            </div>
                            {notes ?
                                <div className='ms-Grid-row p-5'>
                                    <div className='ms-Grid-col ms-sm12 ms-md12 ms-lg12'>
                                        {notes}
                                    </div>
                                </div>
                                : ""
                            }
                            <div className={this.state.oppData.opportunityState === 10 ? "ms-Grid bg-grey hide" : "ms-Grid bg-grey"}>
                                <div className='ms-Grid-row pt15'>
                                    <div className=' ms-Grid-col ms-sm12 ms-md12 ms-lg12'>
                                        <TextField
                                            label={<Trans>newNotes</Trans>}
                                            multiline
                                            rows={6}
                                            value={this.state.addNotes}
                                            onChanged={(value) => this.handleChangeNewNotes(value)}

                                        />
                                    </div>

                                </div>

                                <div className='ms-Grid-row pb250'>
                                    <div className=' ms-Grid-col ms-sm6 ms-md8 ms-lg10'>
                                        {
                                            newNotesLoading ?
                                                <Spinner size={SpinnerSize.large} label='' ariaLive='assertive' className="pt15 pull-right" />
                                                : ""
                                        }
                                        {
                                            this.state.newNoteMsg ?
                                                <MessageBar
                                                    messageBarType={this.state.MessageBarType}
                                                    isMultiline={false}
                                                >
                                                    {this.state.MessagebarText}
                                                </MessageBar>
                                                : ""
                                        }
                                    </div>
                                    <div className=' ms-Grid-col ms-sm6 ms-md8 ms-lg2 pb15'><br />
                                        <PrimaryButton className={this.state.isSendDisable ? "pull-right btnDisable" : "pull-right"} onClick={this.fnSaveNewNotes} disabled={this.state.isSendDisable}><Glyphicon glyph='play' /></PrimaryButton>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div className=' ms-Grid-col ms-sm12 ms-md12 ms-lg3 p-l-10 TeamMembersBG hide'>
                            <h3><Trans>teamMembers</Trans></h3>
                            <TeamMembersView  />
                        </div>
                    </div>
                </div>


            );
        }
    }
}