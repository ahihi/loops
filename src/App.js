import React from "react";
import Tone from "tone";

import './App.css';

import LoopsSketch from "./LoopsSketch";
import LoopToggle from "./LoopToggle";

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded: 0,
            loadCount: -1,
            playing: false,
            playersOn: {}
        };
        this.players = {};
        this.envs = {};
        this.analyzers = {};
        this.analysisSize = 256;
    }

    async componentDidMount() {
        const sounds = ["bass", "drums", "melody", "pad"];
        //this.setState({loaded: 1, loadCount: 1});
        await this.loadPlayers(sounds);
        this.withPlayers(p => {
            p.loop = true;
        });
    }

    async loadPlayers(sounds) {
        this.setState({
            loaded: 0,
            loadCount: sounds.length
        });
        for(const i in sounds) {
            const sound = sounds[i];
            const url = process.env.PUBLIC_URL + "/" + sound + ".wav";
            const gain = new Tone.Gain(1.0).toMaster();
            const player = new Tone.Player()
                .connect(gain);
            const env = new Tone.Envelope(2.0, 0.0, 1.0, 2.0);
            env.attackCurve = "linear";
            env.releaseCurve = "linear";
            env.connect(gain.gain);
            const analyzer = new Tone.Analyser("waveform", this.analysisSize);
            analyzer.smoothing = 0.95;
            gain.connect(analyzer);
            
            await player.load(url);

            this.players[sound] = player;
            this.envs[sound] = env;
            this.analyzers[sound] = analyzer;
            this.setState({loaded: this.state.loaded + 1});
        }
    }
    
    withPlayers = (f) => {
        for(const k in this.players) {
            f(this.players[k], k);
        }
    } 
    
    playLoops = e => {
        const t = Tone.now();
        this.withPlayers(p => p.start(t));
    }

    stopLoops = e => {
        const t = Tone.now();
        this.withPlayers(p => p.stop(t));
    }

    setPlayer(sound, on) {
        if(!this.state.playing) {
            const t = Tone.now();
            this.withPlayers(p => p.start(t));
            this.setState({playing: true});
        }

        const env = this.envs[sound];
        if(on) {
            env.triggerAttack();
        } else {
            env.triggerRelease();
        }
    }
    
    render() {
        let elem;
        if(this.state.loaded < this.state.loadCount) {
            elem = (
                <p id="loading">
                  <span className="done">{"•".repeat(this.state.loaded)}</span><span className="wait">{"•".repeat(this.state.loadCount-this.state.loaded)}</span>
                </p>
            );
        } else {
            const makeToggle = sound =>
                <LoopToggle
                  className={ this.state.loaded === this.state.loadCount ? "visible" : "" }
                  id={"toggle-"+sound}
                  label={sound[0]}
                  onOn={() => this.setPlayer(sound, true)}
                  onOff={() => this.setPlayer(sound, false)}
                />;
            elem = (
                <div id="loops">
                  {makeToggle("bass")}
                  {makeToggle("drums")}
                  {makeToggle("melody")}
                  {makeToggle("pad")}
                </div>
            );
        }
        
        return (
            <div>
              { this.state.loaded === this.state.loadCount
                ? <LoopsSketch envs={this.envs} analyzers={this.analyzers} analysisSize={this.analysisSize} />
                : null
              }
              {elem}
            </div>
        );
    }

}

export default App;
