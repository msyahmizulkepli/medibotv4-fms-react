import React, { Component } from "react";
import Connection from './Connection';

class Home extends Component {
    state = {};
	render() {
		return (
				<div>
                    <h1 className="text-center mt-3">Robot Control Page</h1>
					<Connection/>
				</div>
		);
	}
}

export default Home;