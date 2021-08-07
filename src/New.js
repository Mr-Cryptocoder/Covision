import React, { Component } from "react";
import ReportHelper from "./contracts/ReportHelper.json";
import getWeb3 from "./getWeb3";
import { Form, Container, Button, Segment, Header, Icon } from 'semantic-ui-react';
import { withRouter } from 'react-router-dom';
import "./App.css";
import Layout from "./components/Layout";

const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

class New extends Component {
    state = {
        web3: null,
        accounts: null,
        contract: null,
        status: null,
        id: null,
        location: null,
        ipfs_path: null,
        loading: false
    };

    statusOptions = [
        { key: 'i', text: 'Infected', value: 0 },
        { key: 'r', text: 'Recovered', value: 1 },
        { key: 'd', text: 'Dead', value: 2 },
    ];

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
    };

    handleStatus = (event, data) => {
        event.preventDefault();

        this.setState({ status: data.value });
    }

    onSubmit = async (event) => {
        event.preventDefault();

        const initialReport = {
            id: this.state.id,
            location: this.state.location,
            institute: event.target.institute.value,
            symptoms: event.target.symptoms.value,
            test: event.target.tests.value,
            onset: event.target.onset.value,
            reportDate: new Date().toISOString().slice(0, 10),
            spread: event.target.spread.value,
        }

        this.setState({ loading: true });

        for await (const file of ipfs.add(JSON.stringify(initialReport))) {
            this.setState({ ipfs_path: file.path });
        };

        await this.state.contract.methods.createNewReport(this.state.id, this.state.status, this.state.location, this.state.ipfs_path).send({ from: this.state.accounts[0] });

        const id = await this.state.contract.methods.getLastReportId().call({ from: this.state.accounts[0] });
        this.props.history.push('/' + id);

        this.setState({ loading: false });

    }

    render() {
        if (!this.state.web3) {
            return <div>Loading Web3, accounts, and contract...(Reload the Page)</div>;
        }
        return (
            <Layout>
                <Container>
                    <Segment style={{ margin: '2em' }} basic textAlign="center">
                        <Header as="h1"><Icon name="file alternate outline" />New Report</Header>
                        <hr style={{ width: "10%" }} />

                    </Segment>
                    <Form onSubmit={this.onSubmit}>
                        <Form.Group>
                            <Form.Input name="id" label='Local Id' placeholder='Local Id of the patient' width={4}
                                onChange={event => { this.setState({ id: event.target.value }) }} />
                            <Form.Input name="location" label='Country' placeholder='Country reporting the patient' width={4}
                                onChange={event => { this.setState({ location: event.target.value }) }} />
                            <Form.Input name="institute" label='Medical Organisation' placeholder='Name of the institute reporting the patient' width={8} />
                        </Form.Group>
                        <Form.Group>
                            <Form.Input name="symptoms" label='Symptoms' placeholder='Enter the symptoms, each seperated by a comma' width={6} />
                            <Form.Input name="onset" label='Symptoms On-set Date' type="date" width={4} />
                            <Form.Input name="tests" label='Medical Tests' placeholder='Medical tests performed on the patient' width={8} />
                        </Form.Group>
                        <Form.Group>
                            <Form.Input name="spread" label='Spread Factor' type="number" placeholder='Approximate number of individuals who came in direct/indirect contact with the patient before reporting' width={10} />
                            <Form.Select name="status" label="Patient's Current Status" onChange={this.handleStatus} placeholder="Status" search options={this.statusOptions} />
                        </Form.Group>
                        <Button loading={this.state.loading} type="submit" basic color="red" content="Submit Initial Report" />
                    </Form>
                </Container>
            </Layout>
        );
    }
}

export default withRouter(New);
