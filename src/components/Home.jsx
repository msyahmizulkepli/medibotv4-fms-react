import React, { Component } from "react";
import Connection from './Connection';
import { Row , Col , Container } from "react-bootstrap";
import RobotState from "./RobotState";
import Map from "./Map";

class Home extends Component {
    state = {};
	render() {
		return (
				<div>
                    <h1 className="text-center mt-3">Robot Control Page</h1>
					<Connection/>
					<Map/>
					<RobotState/>
				</div>
		);
	}
}

export default Home;