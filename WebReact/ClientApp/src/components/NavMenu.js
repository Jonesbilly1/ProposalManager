﻿/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/

import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Glyphicon, Nav, Navbar, NavItem } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import '../Style.css';
import { getQueryVariable } from '../common';
import { Trans } from "react-i18next";

export class NavMenu extends Component {
    displayName = NavMenu.name

    constructor(props) {
        super(props);

        this.state = {
            userProfile: this.props.userProfile
        };
    }

    componentDidMount() {

    }


    render() {
        let menuRoot = true;
        if (window.location.pathname === "/" || window.location.pathname === "/Notifications") {
            menuRoot = true;
        } else if (window.location.pathname === "/OpportunityDetails" || window.location.pathname === "/OpportunitySummary" || window.location.pathname === "/OpportunityNotes" || window.location.pathname === "/OpportunityStatus" || window.location.pathname === "/OpportunityChooseTeam") {
            menuRoot = false;
        }

        let setupRoot = false;
        if (window.location.pathname.toLowerCase() === "/setup") {
            setupRoot = true;
        }

        const oppId = getQueryVariable('opportunityId');

        let isAdmin = false;
        if (this.state.userProfile.roles.filter(x => x.displayName === "Administrator").length > 0) {
            console.log("NavMenu Render isAdmin = true");
            isAdmin = true;
        }

        return (
            <Navbar inverse fixedTop fluid collapseOnSelect>
                <Navbar.Header>
                    <Navbar.Brand>
                        <Link to={'/'}><Trans>proposalManager</Trans></Link>
                    </Navbar.Brand>
                    <Navbar.Toggle />
                </Navbar.Header>
                <Navbar.Collapse>
                    {
                        setupRoot ?
                            <Nav >
                                <LinkContainer to={'/Setup'} exact>
                                    <NavItem eventKey={1} >
                                        <i className="ms-Icon ms-Icon--HomeSolid pr10" aria-hidden="true"/> <Trans>setup</Trans>
                                    </NavItem>
                                </LinkContainer>
                            </Nav>
                            :
                            menuRoot ?
                                <Nav >
                                    <LinkContainer to={'/'} exact>
                                        <NavItem eventKey={1} >
                                            <i className="ms-Icon ms-Icon--HomeSolid pr10" aria-hidden="true"/> <Trans>dashboard</Trans>
                                        </NavItem>
                                    </LinkContainer>

                                    {
                                        isAdmin &&
                                        <Nav>
                                            <LinkContainer to={'/Administration'} exact >
                                                <NavItem eventKey={3}>
                                                    <i className="ms-Icon ms-Icon--Admin NavmenuAlign" aria-hidden="true"/> <Trans>administration</Trans>
                                                </NavItem>
                                            </LinkContainer>
                                            <LinkContainer to={'/Settings'} exact >
                                                <NavItem eventKey={4}>
                                                    <i className="ms-Icon ms-Icon--Settings NavmenuAlign" aria-hidden="true"/> <Trans>settings</Trans>
                                                </NavItem>
                                            </LinkContainer>
                                        </Nav>
                                    }
                                </Nav>
                                :
                                <Nav >
                                    <LinkContainer to={'/OpportunityDetails?opportunityId=' + oppId + '&oppComponent=Summary'} >
                                        <NavItem eventKey={1}>
                                            <Glyphicon glyph='list' /> <Trans>summary</Trans>
                                        </NavItem>
                                    </LinkContainer>
                                    <LinkContainer to={'/OpportunityDetails?opportunityId=' + oppId + '&oppComponent=Notes'} >
                                        <NavItem eventKey={2}>
                                            <Glyphicon glyph='edit' /> <Trans>notes</Trans>
                                        </NavItem>
                                    </LinkContainer>
                                    <LinkContainer to={'/OpportunityDetails?opportunityId=' + oppId + '&oppComponent=Status'} >
                                        <NavItem eventKey={3}>
                                            <Glyphicon glyph='check' /> <Trans>status</Trans>
                                        </NavItem>
                                    </LinkContainer>
                                </Nav>
                    }
                </Navbar.Collapse>
            </Navbar>
        );
    }
}
