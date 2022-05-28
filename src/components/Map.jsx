import React, { Component } from "react";
import {Row, Col, Form, Button, ButtonGroup, ListGroup, ToggleButton, ToggleButtonGroup, FloatingLabel, Modal, Alert} from "react-bootstrap";
import { IoNavigate, IoCloseCircleOutline, IoLocation, IoRemoveOutline, IoAddOutline, IoCaretBack, IoCaretForward, IoCaretUp, IoCaretDown, IoNavigateOutline, IoSaveOutline, IoTrashOutline } from "react-icons/io5";
import Config from "../scripts/config";
import Teleoperation from "./Teleoperation";
window.navigation = false;
window.homing = false;
window.navoption = 1;

class Map extends Component {
    state = {
        ros:null,
		viewer:null,
		grid_client: null,
		robot_nav: 0,
		show_path:true,
		pathView1:null,
		pathTopic1:null,
		pathView2:null,
		pathTopic2:null,
		label:[],
		show_set_spot:false,
		goal_status:{message: "Doing nothing. Waiting for goal...",variant: "info",show:true}
    };

    constructor(){
		super();
		this.view_map = this.view_map.bind(this);
		this.showPath = this.showPath.bind(this);
		this.hidePath = this.hidePath.bind(this);
	}

    init_connection(){
		// eslint-disable-next-line
		this.state.ros = new window.ROSLIB.Ros();

		this.state.ros.on("connection", () => {
			console.info("Connected to ROS:MAP");
			this.setState({connected:true});
		});

		this.state.ros.on("close", () => {
			console.warn("Disconnected from ROS:MAP");
			this.setState({connected:false});
			//try to reconnect every 3 seconds
			setTimeout(()=>{
				try{
					this.state.ros.connect(
						"ws://"+Config.ROSBRIDGE_SERVER_IP+":"+Config.ROSBRIDGE_SERVER_PORT+""
					);
				}catch(error){
					console.error("Connection problem : MAP");
				}
			},Config.RECONNECTION_TIMER);
		});

		try{
			this.state.ros.connect(
				"ws://"+Config.ROSBRIDGE_SERVER_IP+":"+Config.ROSBRIDGE_SERVER_PORT+""
			);
		}catch(error){
			console.error("Connection problem : MAP");
		}

		this.state.ros.on("error", (error) => {
			// console.log('Error connecting to ROS: ', error);
		});
	}

    componentDidMount(){
		this.init_connection();
		this.view_map();
		this.showPath();
	}

    view_map(){

		this.state.viewer = new window.ROS2D.Viewer({
			divID: "nav_div",
			width: 640,
			height: 480,
		});

		var navClient = new window.NAV2D.OccupancyGridClientNav2({
			ros: this.state.ros,
			rootObject: this.state.viewer.scene,
			viewer: this.state.viewer,
			continuous: true,
		});
 

		// var navClient1 = new window.NAV2D.OccupancyGridClientNav({
		// 	ros: this.state.ros,
		// 	rootObject: this.state.viewer.scene,
		// 	viewer: this.state.viewer,
		// 	serverName: Config.ROBOT1_NAMESPACE+"/move_base",
		// 	robot_pose: Config.ROBOT1_NAMESPACE+"/robot_pose",
		// 	initial_pose: Config.ROBOT1_NAMESPACE+"/initialpose",
		// 	plan: Config.ROBOT1_NAMESPACE+"/move_base/NavfnROS/plan",
		// 	withOrientation: true,
		// 	continuous: true,
		// });

		// var navClient2 = new window.NAV2D.OccupancyGridClientNav({
		// 	ros: this.state.ros,
		// 	rootObject: this.state.viewer.scene,
		// 	viewer: this.state.viewer,
		// 	serverName: Config.ROBOT2_NAMESPACE+"/move_base",
        //     robot_pose: Config.ROBOT2_NAMESPACE+"/robot_pose",
		// 	initial_pose: Config.ROBOT2_NAMESPACE+"/initialpose",
    	// 	plan: Config.ROBOT2_NAMESPACE+"/move_base/NavfnROS/plan",
		// 	withOrientation: true,
		// 	continuous: true,
		// });
	}

    navigation(){
		if(this.state.pathView==null && this.state.pathTopic==null && this.state.show_path){
			this.showPath();
		}
		try{
			window.navigation = true;
			window.homing = false;
		}catch(error){
			console.error("window.navigation or window.homing problem");
		}
	}

	localize(){
		if(this.state.pathView==null && this.state.pathTopic==null && this.state.show_path){
			this.showPath();
		}
		try{
			window.navigation = false;
			window.homing = true;
		}catch(error){
			console.error("window.navigation or window.homing problem");
		}
	}

	stop(){
		try{
			window.navigation = false;
			window.homing = false;
		}catch(error){
			console.error("window.navigation or window.homing problem");
		}
		// stop robot1
		var move_base_stop1 = new window.ROSLIB.Topic({
	        ros: this.state.ros,
	        name: Config.ROBOT1_NAMESPACE+'/move_base/cancel',
	        messageType: 'actionlib_msgs/GoalID'
	    });
	    var move_base_stop_msg1 = new window.ROSLIB.Message({
	        id: ''
	    });
	    move_base_stop1.publish(move_base_stop_msg1);
		// stop robot2
		var move_base_stop2 = new window.ROSLIB.Topic({
	        ros: this.state.ros,
	        name: Config.ROBOT2_NAMESPACE+'/move_base/cancel',
	        messageType: 'actionlib_msgs/GoalID'
	    });
	    var move_base_stop_msg2 = new window.ROSLIB.Message({
	        id: ''
	    });
	    move_base_stop2.publish(move_base_stop_msg2);
	    this.hidePath(true);
	}

	showPath(){
		this.setState({show_path:true});
		// show robot1 path
		if(this.state.pathView1==null && this.state.pathTopic1==null){
			this.state.pathView1 = new window.ROS2D.PathShape({
	            ros: this.state.ros,
	            strokeSize: 0.2,
	            strokeColor: "green",
	        });

	        this.state.viewer.scene.addChild(this.state.pathView1);

	        this.state.pathTopic1 = new window.ROSLIB.Topic({
	            ros: this.state.ros,
	            name: Config.ROBOT1_NAMESPACE+'/move_base/NavfnROS/plan',
	            messageType: 'nav_msgs/Path'
	        });

	        this.state.pathTopic1.subscribe((message)=>{
	        	try{
	        		this.state.pathView1.setPath(message);
	        	}catch(error){
	        		console.error("show path error");
	        	}
	            
	        });
		}
		// show robot2 path
		if(this.state.pathView2==null && this.state.pathTopic2==null){
			this.state.pathView2 = new window.ROS2D.PathShape({
	            ros: this.state.ros,
	            strokeSize: 0.2,
	            strokeColor: "green",
	        });

	        this.state.viewer.scene.addChild(this.state.pathView2);

	        this.state.pathTopic2 = new window.ROSLIB.Topic({
	            ros: this.state.ros,
	            name: Config.ROBOT2_NAMESPACE+'/move_base/NavfnROS/plan',
	            messageType: 'nav_msgs/Path'
	        });

	        this.state.pathTopic2.subscribe((message)=>{
	        	try{
	        		this.state.pathView2.setPath(message);
	        	}catch(error){
	        		console.error("show path error");
	        	}
	            
	        });
		}
	}

	hidePath(isStopping=false){
		if(!isStopping){
			this.setState({show_path:false});
		}
		
        this.state.viewer.scene.removeChild(this.state.pathView1);
		this.state.viewer.scene.removeChild(this.state.pathView2);
        if (this.state.pathTopic1) {
            this.state.pathTopic1.unsubscribe();
        }
		if (this.state.pathTopic2) {
			this.state.pathTopic2.unsubscribe();
		}
        this.setState({pathView1:null});
        this.setState({pathTopic1:null});
		this.setState({pathView2:null});
        this.setState({pathTopic2:null});
	}


    zoomInMap(){
        var zoom = new window.ROS2D.ZoomView({
            ros: this.state.ros,
            rootObject: this.state.viewer.scene
        });
        zoom.startZoom(250, 250);
        zoom.zoom(1.2);
    }

    zoomOutMap(){
        var zoom = new window.ROS2D.ZoomView({
            ros: this.state.ros,
            rootObject: this.state.viewer.scene
        });
        zoom.startZoom(250, 250);
        zoom.zoom(0.8);
    }


    panUpMap(){
        var pan = new window.ROS2D.PanView({
            ros: this.state.ros,
            rootObject: this.state.viewer.scene
        });
        pan.startPan(250, 250);
        pan.pan(250,300);
    }

    panDownMap(){
        var pan = new window.ROS2D.PanView({
            ros: this.state.ros,
            rootObject: this.state.viewer.scene
        });
        pan.startPan(250, 250);
        pan.pan(250,200);
    }

    panRightMap(){
        var pan = new window.ROS2D.PanView({
            ros: this.state.ros,
            rootObject: this.state.viewer.scene
        });
        pan.startPan(250, 250);
        pan.pan(200,250);
    }

    panLeftMap(){
        var pan = new window.ROS2D.PanView({
            ros: this.state.ros,
            rootObject: this.state.viewer.scene
        });
        pan.startPan(250, 250);
        pan.pan(300,250);
    }

	render() {
		return (
				<div>
                    <ListGroup.Item variant="light">
						<Row>
							<Col>
								<Row>
									<p id="nav_div" className="text-center"></p>
								</Row>
								<Row align="center">
									<h5>
										ZOOM VIEW&emsp;
										<ButtonGroup vertical size="md" className="gap-2">				
											<Button className="rounded-circle" onClick={()=>{this.zoomInMap()}} variant="outline-secondary"><IoAddOutline/></Button>
											<Button className="rounded-circle" onClick={()=>{this.zoomOutMap()}} variant="outline-secondary"><IoRemoveOutline/></Button>
										</ButtonGroup>&nbsp;&nbsp;&nbsp;
										PAN VIEW&emsp;
										<ButtonGroup size="md">	
											<Button className="rounded-circle" onClick={()=>{this.panLeftMap()}} variant="outline-secondary"><IoCaretBack/></Button>
										</ButtonGroup>
										<ButtonGroup vertical size="md" className="gap-3">		
											<Button className="rounded-circle" onClick={()=>{this.panUpMap()}} variant="outline-secondary"><IoCaretUp/></Button>
											<Button className="rounded-circle" onClick={()=>{this.panDownMap()}} variant="outline-secondary"><IoCaretDown/></Button>
										</ButtonGroup>
										<ButtonGroup size="md">
											<Button className="rounded-circle" onClick={()=>{this.panRightMap()}} variant="outline-secondary"><IoCaretForward/></Button>
										</ButtonGroup>	
									</h5>
								</Row>
							</Col>
							<Col>
								<br></br>
								<Row align="center">
									<h5>NAVIGATION</h5><br></br><br></br>
									<Row>
										<Col align="center">
											<ToggleButtonGroup type="radio" name="robot_nav_btn" onChange={(value)=>{this.setState({robot_nav: value}); window.navoption = value;}}>
												<ToggleButton id="auto_nav_btn" value={0} variant="outline-primary">
												&nbsp;&nbsp;Auto&nbsp;&nbsp;
												</ToggleButton>
												<ToggleButton id="robot1_nav_btn" value={1} variant="outline-info">
													Robot 1
												</ToggleButton>
												<ToggleButton id="robot2_nav_btn" value={2} variant="outline-danger">
													Robot 2
												</ToggleButton>
											</ToggleButtonGroup>
										</Col>
									</Row>
									<br></br><p></p><br></br>
									<Row>
										<ButtonGroup horizontal size="lg">
											<Button onClick={()=>{this.localize()}} variant="success"> LOCALIZE <IoLocation/></Button>
											<Button onClick={()=>{this.navigation()}} variant="primary">NAVIGATE <IoNavigate/></Button>
											<Button onClick={()=>{this.stop()}} variant="danger">STOP <IoCloseCircleOutline/></Button>
										</ButtonGroup>
									</Row>
								</Row>
								<br></br>
								<Row align="center">
									<Col></Col><Col></Col><Col>
										<h6>
										<Form>
										<Form.Check label="SHOW PATH" type="switch" id="show-path-switch" checked={this.state.show_path?true:false} onChange={()=>{this.state.show_path?this.hidePath():this.showPath()}}/>
										</Form>
										</h6>
									</Col><Col></Col><Col></Col>
								</Row>
								<hr></hr><br></br>
								<Row align="center">
									<h5>TELEOPERATION</h5><br></br><br></br>
									<Teleoperation/>
								</Row>
							</Col>
						</Row>
                    </ListGroup.Item>
				</div>
		);
	}
}

export default Map;