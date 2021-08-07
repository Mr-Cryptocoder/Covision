import React, { Component } from "react";
import ReportHelper from "./contracts/ReportHelper.json";
import getWeb3 from "./getWeb3";
import { Form, Container, Button, Segment, Icon, Header } from 'semantic-ui-react';
import Layout from './components/Layout';
import { withRouter } from 'react-router-dom';
import "./App.css";

const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

class RecNew extends Component {
    state = {
        web3: null,
        accounts: null,
        contract: null,
        loading: false,
        ipfs_path: null
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
    };

    onSubmit = async (event) => {
        event.preventDefault();

        const newRecord = {
            drugs: event.target.drugs.value,
            tests: event.target.tests.value,
            temp: event.target.temp.value,
            bp: event.target.bp.value,
            extra: event.target.extra.value,
            recordDate: new Date().toISOString().slice(0, 10)
        }

        this.setState({ loading: true });

        for await (const file of ipfs.add(JSON.stringify(newRecord))) {
            this.setState({ ipfs_path: file.path });
        };

        await this.state.contract.methods.createNewRecord(this.props.match.params.id, this.state.ipfs_path).send({ from: this.state.accounts[0] });

        this.props.history.push('/' + this.props.match.params.id);

        this.setState({ loading: false });

    }

    render() {
        if (!this.state.web3) {
            return <div>Loading Web3, accounts, and contract...</div>;
        }
        return (
            <Layout>
                <Container style={{ width: "75%" }}>
                    <Segment style={{ margin: '2em' }} basic textAlign="center">
                        <Header as="h1"><Icon name="file alternate outline" />New Record</Header>
                        <hr style={{ width: "10%" }} />

                    </Segment>
                    <Form onSubmit={this.onSubmit}>
                        <Form.Group>
                            <Form.Input name="drugs" label='Drugs Administered' placeholder='Enter the medication, each seperated by a comma' width={8} />
                            <Form.Input name="tests" label='Medical Tests' placeholder='Enter medical tests that the patient went through' width={8} />
                        </Form.Group>
                        <Form.Group>
                            <Form.Input name="temp" label='Body Temperature' placeholder="Patient's body temperature in Fahrenheit" width={8} />
                            <Form.Input name="bp" label='Bloop Pressure' placeholder="Patient's Blood Pressure as SYS/DIA" width={8} />
                        </Form.Group>
                        <Form.Input name="extra" label="Physician's Comment" placeholder='Enter the comments of the physician after analysing the patient' />
                        <Button loading={this.state.loading} type="submit" basic color="black" content="Create New Record" />
                    </Form>
                </Container>
            </Layout>
        );
    }
}

export default withRouter(RecNew);
