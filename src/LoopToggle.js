import React from 'react';
import './LoopToggle.css';

class LoopToggle extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            on: false,
            visible: false
        };
        this.onOn = props.onOn || (() => {});
        this.onOff = props.onOff || (() => {});
    }

    componentDidMount() {
        this.setState({visible: true});
    }
    
    toggle = () => {
        const newOn = !this.state.on;
        this.setState({on: newOn});
        if(newOn) {
            this.onOn();
        } else {
            this.onOff();
        }
    }
    
    render() {
        return (
            <button
              id={this.props.id}
              className={"loop-toggle" + (this.state.on ? " on" : "") + (this.state.visible ? " visible" : "")}
              onClick={this.toggle}
            >
              {this.props.label}
            </button>
        );
    }
}

export default LoopToggle;
