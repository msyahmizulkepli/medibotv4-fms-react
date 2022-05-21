import React, { Component } from "react";
import Connection from './Connection';
import { Row , Col , Container } from "react-bootstrap";
import Teleoperation from "./Teleoperation";

class Home extends Component {
    state = {};
	render() {
		return (
				<div>
                    <h1 className="text-center mt-3">Robot Control Page</h1>
					<Connection/>
					<Teleoperation/>
				</div>
		);
	}
}

export default Home;