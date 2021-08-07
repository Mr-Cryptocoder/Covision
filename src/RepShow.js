import React, { Component } from "react";
import ReportHelper from "./contracts/ReportHelper.json";
import getWeb3 from "./getWeb3";
import "./App.css";
import Layout from './components/Layout';
import { withRouter, Link } from 'react-router-dom';
import { Container, Table, TableHeader, TableBody, Button, Form, Grid, Card, Icon, Segment, Header } from "semantic-ui-react";

class RepShow extends Component {
    state = {
        web3: null,
        accounts: null,
        contract: null,
        report: null,
        reportId: null,
        ipfs_hash: null,
        records: null,
        theRecord: null,
        loading: false,
        status: null,
        currentStatus: null
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

            const size = await instance.methods.getRecordsLength(this.props.match.params.id).call();
            let reportParam = await instance.methods.getReport(this.props.match.params.id).call();

            if (size > 0) {
                const records = await Promise.all(
                    Array(parseInt(size)).fill().map(async (Element, index) => {
                        let rec = await instance.methods.getRecord(this.props.match.params.id, index).call();
                        let response = await fetch("https://ipfs.io/ipfs/" + rec);
                        let json = await response.json();
                        return json;
                    })
                );
                this.setState({ records });
            }

            this.setState({ web3, accounts, contract: instance, reportId: this.props.match.params.id, ipfs_hash: reportParam[2], currentStatus: reportParam[4] });

        } catch (error) {
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }

        this.renderReport();
    };

    renderReport = () => {
        fetch("https://ipfs.io/ipfs/" + this.state.ipfs_hash)
            .then(res => res.json())
            .then(json => {
                this.setState({ report: json });
            });
    }

    renderRecords = () => {
        return (
            this.state.records.map((record, index) =>
                <Table.Row>
                    <Table.Cell>{this.state.records[index].recordDate}</Table.Cell>
                    <Table.Cell>{this.state.records[index].drugs}</Table.Cell>
                    <Table.Cell>{this.state.records[index].tests}</Table.Cell>
                    <Table.Cell>{this.state.records[index].temp}</Table.Cell>
                    <Table.Cell>{this.state.records[index].bp}</Table.Cell>
                    <Table.Cell>{this.state.records[index].extra}</Table.Cell>
                </Table.Row>
            )
        )
    }

    getStatus = () => {
        if (this.state.currentStatus == 0)
            return ({ status: "Infected", color: "red" });
        else if (this.state.currentStatus == 1)
            return ({ status: "Recovered", color: "green" });
        else
            return ({ status: "Dead", color: "black" });
    }

    onSubmit = async () => {

        this.setState({ loading: true });

        await this.state.contract.methods.updateStatus(this.state.reportId, this.state.status).send({ from: this.state.accounts[0] });

        window.location.reload();
    }

    handleStatus = (event, data) => {
        event.preventDefault();

        this.setState({ status: data.value });
    }

    render() {
        if (!this.state.web3) {
            return <div>Loading Web3, accounts, and contract...</div>;
        }
        return (
            <Layout>
                <Container>
                    <Segment style={{ margin: '2em' }} basic textAlign="center">
                        <Header as="h1"><Icon name="file alternate outline" />Initial Report and Records</Header>
                        <hr style={{ width: "10%" }} />

                    </Segment>
                    <Grid>
                        <Grid.Column width={12}>
                            {this.state.report != null &&
                                <Table celled>
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.HeaderCell width={11}>Key</Table.HeaderCell>
                                            <Table.HeaderCell width={5}>Value</Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>

                                    <TableBody>
                                        <Table.Row>
                                            <Table.Cell style={{ fontWeight: "bold" }}>Patient's Local Id</Table.Cell>
                                            <Table.Cell>{this.state.report.id}</Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell style={{ fontWeight: "bold" }}>Country</Table.Cell>
                                            <Table.Cell>{this.state.report.location}</Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell style={{ fontWeight: "bold" }}>Medical Organisation</Table.Cell>
                                            <Table.Cell>{this.state.report.institute}</Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell style={{ fontWeight: "bold" }}>Symptoms</Table.Cell>
                                            <Table.Cell>{this.state.report.symptoms}</Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell style={{ fontWeight: "bold" }}>Symptoms Onset Date</Table.Cell>
                                            <Table.Cell>{this.state.report.onset}</Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell style={{ fontWeight: "bold" }}>Report Date</Table.Cell>
                                            <Table.Cell>{this.state.report.reportDate}</Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell style={{ fontWeight: "bold" }}>Spread Index (Number of individuals who came in direct or indirect contact with the infected patient)</Table.Cell>
                                            <Table.Cell>{this.state.report.spread}</Table.Cell>
                                        </Table.Row>
                                    </TableBody>
                                </Table>}

                            {this.state.records != null &&
                                <React.Fragment>
                                    <Segment style={{ margin: '2em' }} basic textAlign="center">
                                        <Header as="h3">Records</Header>
                                        <hr style={{ width: "5%" }} />
                                    </Segment>
                                    <Table celled>
                                        <TableHeader>
                                            <Table.Row>
                                                <Table.HeaderCell>Record Date</Table.HeaderCell>
                                                <Table.HeaderCell>Drugs Administered</Table.HeaderCell>
                                                <Table.HeaderCell>Medical Test</Table.HeaderCell>
                                                <Table.HeaderCell>Temperature</Table.HeaderCell>
                                                <Table.HeaderCell>Blood Pressure</Table.HeaderCell>
                                                <Table.HeaderCell>Physician's Comment</Table.HeaderCell>
                                            </Table.Row>
                                        </TableHeader>
                                        <TableBody>
                                            {this.state.records != null && this.renderRecords()}
                                        </TableBody>
                                    </Table></React.Fragment>}
                        </Grid.Column>
                        <Grid.Column width={4}>
                            <Card
                                header={<h1 style={{ color: this.getStatus().color }}>{this.getStatus().status}</h1>}
                                description={<h4 style={{ fontWeight: 'bold' }}>CURRENT STATUS OF PATIENT</h4>}
                            />
                            <Form onSubmit={this.onSubmit}>
                                <Form.Group>
                                    <Form.Select name="status" label="Patient's Current Status" onChange={this.handleStatus} placeholder="Status" search options={this.statusOptions} required />
                                </Form.Group>
                                <Button loading={this.state.loading} basic color="black" content="Change Status" />
                            </Form>
                            <hr style={{ margin: "1.2em" }} />
                            <Link to={"/" + this.state.reportId + "/new"}>
                                <Button fluid basic color="grey" content="Add Record" />
                            </Link>
                        </Grid.Column>
                    </Grid>
                </Container>
            </Layout>
        );
    }
}

export default withRouter(RepShow);
