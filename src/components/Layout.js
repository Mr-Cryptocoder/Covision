import React from 'react';
import { Menu, Container, Image, Dropdown } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

export default props => {
    return (
        <React.Fragment>
            <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css" />
            <link rel="stylesheet" href="index.css" />

            <Menu style={{ margin: '0', borderRadius: '0' }}>
                <Container>
                    <Menu.Item as={Link} header to="/">
                        <h2>Covision</h2>
                    </Menu.Item>
                    <Menu.Item as={Link} to="/"
                        name='Home'
                    />
                        <Menu.Item as={Link} to="/new">
                            New Report
                        </Menu.Item>
                </Container>
            </Menu>

            <Container style={{ marginTop: '2em' }}>
                {props.children}
            </Container >
        </React.Fragment>
    );
}