import React, { Component } from "react";
import ReportHelper from "./contracts/ReportHelper.json";
import getWeb3 from "./getWeb3";
import { Container, Card, Header, Segment, Icon } from 'semantic-ui-react';
import { withRouter } from 'react-router-dom';
import "./App.css";
import Layout from "./components/Layout";

class New extends Component {
    state = {
        web3: null,
        accounts: null,
        contract: null,
        loading: false,
        items: null
    };

    componentDidMount = async () => {
        try {

            const web3 = await getWeb3();

            const accounts = await web3.eth.getAccounts();

            const networkId = await web3.eth.net.getId();
            const deployedNetwork = ReportHelper.networks[networkId];
            const instance = new web3.eth.Contract(
                ReportHelper.abi,
                deployedNetwork && deployedNetwork.address,
            );


            this.setState({ web3, accounts, contract: instance });

        } catch (error) {
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }

        this.getItems();
    };

    getStatus = (val) => {
        if (val == 0)
            return ({ status: "Infected", color: "red" });
        else if (val == 1)
            return ({ status: "Recovered", color: "green" });
        else
            return ({ status: "Dead", color: "black" });
    }

    getItems = async () => {
        const list = this.props.location.state.reportList;

        const itemsList = list.map(async (index) => {
            let report = await this.state.contract.methods.getReport(index).call();

            let add = "/" + index;
            let desc = "Reported By: " + report[1].slice(0, 20) + " ....";
            let m = <p style={{ color: this.getStatus(report[4]).color }}><span style={{ color: 'grey' }}>Status: </span>{this.getStatus(report[4]).status}</p>

            let itemObject = {
                href: add,
                header: <Header as="h2">Report Id: {index}</Header>,
                description: desc,
                meta: m,
                fluid: true
            }

            return itemObject;
        });

        const items = await Promise.all(itemsList);

        this.setState({ items });
    }

    render() {
        if (!this.state.web3) {
            return <div>Loading Web3, accounts, and contract...(Reload the Page)</div>;
        }
        else if (this.state.items == null) {
            return <div>No Records Found!.. </div>;
        }
        return (
            <Layout>
                <Container>
                    <Segment style={{ margin: '2em' }} basic textAlign="center">
                        <Header as="h1"><Icon name="file alternate outline" />Search Results</Header>
                        <hr style={{ width: "10%" }} />
                    </Segment>
                    {this.state.items != null &&
                        <Card.Group style={{ marginTop: '1.5em' }} itemsPerRow={3} items={this.state.items} />}
                </Container>
            </Layout>
        );
    }
}

export default withRouter(New);
