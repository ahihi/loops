import React from "react";
import Sketch from "react-p5";

class LoopsSketch extends React.Component {
    constructor(props) {
        super(props);

        window.lsk = this;
        
        this.bassMax = 0.2415;
        this.drumsMax = 0.4135;
        this.melodyMax = 0.1306;
        this.padMax = 0.3539;
    }

    render() {
        return(
            <div>
                <Sketch preload={this.preload} setup={this.setup} draw={this.draw} />
            </div>
        );
    }

    preload = p5 => {
        this.analysisShader = p5.loadShader("default.vert", "loops.frag");
        this.imageShader = p5.loadShader("default.vert", "image.frag");
    }
    
    setup = (p5, parent) => {
        p5.createCanvas(window.innerWidth, window.innerHeight, p5.WEBGL)
            .parent(parent);
        p5.noStroke();
        p5.fill(255);
        
        this.g = p5.createGraphics(p5.width, p5.height, p5.WEBGL);
        this.g.noStroke();
        this.g.fill(255);

        this.analysisImage = p5.createImage(this.props.analysisSize, 4);
    }

    draw = p5 => {
        const w = p5.width;
        const h = p5.height;
        const t = p5.millis() * 0.001;

        const analyses = [
            this.props.analyzers.bass.getValue(),
            this.props.analyzers.drums.getValue(),
            this.props.analyzers.melody.getValue(),
            this.props.analyzers.pad.getValue()
        ];

        const gains = [
            this.props.envs.bass.value,
            this.props.envs.drums.value,
            this.props.envs.melody.value,
            this.props.envs.pad.value
        ];

        for(let y = 0; y < analyses.length; y++) {
            const analysis = analyses[y];
            for(let x = 0; x < analysis.length; x++) {
                const value = analysis[x];
                this.analysisImage.set(x, y, p5.color(Math.round(p5.map(value, -1.0, 1.0, 0, 255)), 0, 0));
            }
        }
        this.analysisImage.updatePixels();

        for(let y = 0; y < gains.length; y++) {
            const gain = gains[y];
            const x = 0;
            const r = p5.red(this.analysisImage.get(x, y));
            this.analysisImage.set(x, y, p5.color(r, Math.round(gain * 255), 0));
        }
        this.analysisImage.updatePixels();
        
        
        this.g.shader(this.analysisShader);
        this.analysisShader.setUniform("resolution", [w, h]);
        this.analysisShader.setUniform("time", t);
        this.analysisShader.setUniform("analysis", this.analysisImage);
        this.analysisShader.setUniform("analysis_resolution", [this.analysisImage.width, this.analysisImage.height]);
        this.analysisShader.setUniform("background", this.g);
        this.g.rect(-0.5*w, -0.5*h, w, h);

        p5.shader(this.imageShader);
        this.imageShader.setUniform("image", this.g);
        this.imageShader.setUniform("time", t);
        p5.rect(-0.5*w, -0.5*h, w, h);
    }
}

export default LoopsSketch;
