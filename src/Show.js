import React, { Component } from "react";
import ReportHelper from "./contracts/ReportHelper.json";
import Layout from './components/Layout';
import countryList from 'react-select-country-list';
import getWeb3 from "./getWeb3";
import { withRouter } from 'react-router-dom';

import "./App.css";
import { Grid, Card, Segment, Header, Container, Table, Form, Button } from "semantic-ui-react";

class App extends Component {
  state = {
    web3: null,
    accounts: null,
    contract: null,
    infected: null,
    recovered: null,
    dead: null,
    countryCounts: null,
    loadingC: null,
    totalRep: null
  };

  componentDidMount = async () => {
    try {

      const countries = countryList().getLabels();

      const web3 = await getWeb3();

      const accounts = await web3.eth.getAccounts();

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = ReportHelper.networks[networkId];
      const instance = new web3.eth.Contract(
        ReportHelper.abi,
        deployedNetwork && deployedNetwork.address,
      );

      const countryCounts = await Promise.all(
        Array(parseInt(countries.length)).fill().map(async (Element, index) => {
          let rec = await instance.methods.getCountryCases(countries[index]).call();
          return { country: countries[index], value: rec };
        }));

      countryCounts.sort((a, b) => {
        if (a.value > b.value)
          return -1;
        if (b.value > a.value)
          return 1;

        return 0;
      });

      const infected = await instance.methods.statusToCount(0).call();
      const recovered = await instance.methods.statusToCount(1).call();
      const dead = await instance.methods.statusToCount(2).call();

      const totalRep = parseInt(infected) + parseInt(recovered) + parseInt(dead);

      this.setState({ web3, accounts, contract: instance, infected, recovered, dead, countryCounts, totalRep });

    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  getCountryData = () => {
    return (this.state.countryCounts.slice(0, 10).map((record, index) =>
      <Table.Row>
        <Table.Cell>{this.state.countryCounts[index].country}</Table.Cell>
        <Table.Cell>{this.state.countryCounts[index].value}</Table.Cell>
      </Table.Row>
    ))
  }

  onSubmitCountry = async (event) => {
    event.preventDefault();

    this.setState({ loadingC: true });

    const country = event.target.searchCountry.value;

    const size = await this.state.contract.methods.getCountryCases(event.target.searchCountry.value).call();

    const reportList = await Promise.all(
      Array(parseInt(size)).fill().map(async (Element, index) => {
        let rec = await this.state.contract.methods.countryToReports(country, index).call();
        return rec;
      }));

    this.props.history.push({
      pathname: '/reports',
      state: { reportList: reportList }
    });
  }

  async getStatusReport(status) {
    const fullList = await Promise.all(
      Array(parseInt(this.state.totalRep)).fill().map(async (Element, index) => {
        let rec = await this.state.contract.methods.getReport(status, index).call();
        return rec[0];
      }));

    const reportList = fullList.filter((item) => {
      return item != -1;
    })

    console.log(reportList);
  }

  myReports = async () => {

    const size = await this.state.contract.methods.getNoOfReports().call({ from: this.state.accounts[0] });

    const reportList = await Promise.all(
      Array(parseInt(size)).fill().map(async (Element, index) => {
        let rec = await this.state.contract.methods.reporterToReports(this.state.accounts[0], index).call();
        return rec;
      }));

    this.props.history.push({
      pathname: '/reports',
      state: { reportList: reportList }
    });
  }

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <Layout>
        <Container>
          <Segment style={{ margin: '1em' }} basic textAlign="center">
            <Header as="h1"> <img width="64px" src={require('./covid.png')} /> Global Covid19 Data</Header>
          </Segment>
          <Grid>
            <Grid.Column width={10}>
              <Segment style={{ margin: '1em' }} basic textAlign="center">
                <Header as="h2">Most Affected Countries</Header>
                <hr style={{ width: "10%" }} />
              </Segment>
              <Table celled>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell width={10}>Country</Table.HeaderCell>
                    <Table.HeaderCell width={6}>Cases</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {this.getCountryData()}
                </Table.Body>
              </Table>
            </Grid.Column>
            <Grid.Column width={6}>

              <Segment style={{ margin: '1em' }} basic textAlign="center">
                <Header as="h2">Summary</Header>
                <hr style={{ width: "10%" }} />
              </Segment>

              <Grid.Row style={{ margin: "1.5em" }}>
                <Card
                  fluid
                  header={<h1 style={{ color: "red" }}>{this.state.infected}</h1>}
                  description={<h3 style={{ fontWeight: 'bold' }}>CURRENTLY INFECTED</h3>}
                />
              </Grid.Row>
              <Grid.Row style={{ margin: "1.5em" }}>
                <Card
                  fluid
                  header={<h1 style={{ color: "green" }}>{this.state.recovered}</h1>}
                  description={<h3 style={{ fontWeight: 'bold' }}>RECOVERED</h3>}
                />
              </Grid.Row>
              <Grid.Row style={{ margin: "1.5em" }}>
                <Card
                  fluid
                  header={<h1 style={{ color: "grey" }}>{this.state.dead}</h1>}
                  description={<h3 style={{ fontWeight: 'bold' }}>DEAD</h3>}
                />
              </Grid.Row>
              <Grid.Row style={{ margin: "1.5em" }}>
                <Header as="h2">Total Cases: {this.state.totalRep}</Header>
              </Grid.Row>
            </Grid.Column>
          </Grid>
        </Container>
        <hr style={{ marginTop: "1.5em", marginBottom: "1.5em", width: "50px" }} />

        <Form onSubmit={this.onSubmitCountry}>
          <Form.Group>
            <Form.Input name="searchCountry" label='Search By Country' placeholder='Country' />
          </Form.Group>
          <Button loading={this.state.loadingC} basic color="black" content="Get Reports" />
        </Form>

        <hr style={{ marginTop: "1.5em", marginBottom: "1.5em", width: "50px" }} />

        <Form onSubmit={(event) => { event.preventDefault(); this.props.history.push('/' + event.target.id.value); }}>
          <Form.Group>
            <Form.Input type="text" name="id" label='Search By Report Id' placeholder='Report Id' />
          </Form.Group>
          <Button basic color="black" content="Get Report" />
        </Form>

        <hr style={{ marginTop: "1.5em", marginBottom: "1.5em", width: "50px" }} />

        <Button onClick={this.myReports} basic color="black">Your Reports</Button>

        <hr style={{ marginTop: "1.5em", marginBottom: "1.5em", width: "50px" }} />

      </Layout>
    );
  }
}

export default withRouter(App);