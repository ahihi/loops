#define TAU 6.283185307179586

precision mediump float;

varying vec2 vTexCoord;

uniform vec2 resolution;
uniform float time;
uniform sampler2D analysis;
uniform vec2 analysis_resolution;
uniform sampler2D background;

//
// GLSL textureless classic 3D noise "cnoise",
// with an RSL-style periodic variant "pnoise".
// Author:  Stefan Gustavson (stefan.gustavson@liu.se)
// Version: 2011-10-11
//
// Many thanks to Ian McEwan of Ashima Arts for the
// ideas for permutation and gradient selection.
//
// Copyright (c) 2011 Stefan Gustavson. All rights reserved.
// Distributed under the MIT license. See LICENSE file.
// https://github.com/stegu/webgl-noise
//

vec3 mod289(vec3 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise
float cnoise(vec3 P)
{
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

// Classic Perlin noise, periodic variant
float pnoise(vec3 P, vec3 rep)
{
  vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

vec3 rgb2hsl(vec3 rgb) {
    float r = rgb.r;
    float g = rgb.g;
    float b = rgb.b;
    float v, m, vm, r2, g2, b2;
    float h = 0.0;
    float s = 0.0;
    float l = 0.0;
    v = max(max(r, g), b);
    m = min(min(r, g), b);
    l = (m + v) / 2.0;
    if(l > 0.0) {
        vm = v - m;
        s = vm;
        if(s > 0.0) {
            s /= (l <= 0.5) ? (v + m) : (2.0 - v - m);
            r2 = (v - r) / vm;
            g2 = (v - g) / vm;
            b2 = (v - b) / vm;
            if(r == v) {
                h = (g == m ? 5.0 + b2 : 1.0 - g2);
            } else if(g == v) {
                h = (b == m ? 1.0 + r2 : 3.0 - b2);
            } else {
                h = (r == m ? 3.0 + g2 : 5.0 - r2);
            }
        }
    }
    h /= 6.0;
    return vec3(h, s, l);
}

vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    float r = l;
    float g = l;
    float b = l;
    float v = (l <= 0.5) ? (l * (1.0 + s)) : (l + s - l*s);
    if(v > 0.0) {
        float m, sv;
        int sextant;
        float fract, vsf, mid1, mid2;
        m = l + l - v;
        sv = (v - m) / v;
        h *= 6.0;
        sextant = int(h);
        fract = h - float(sextant);
        vsf = v * sv * fract;
        mid1 = m + vsf;
        mid2 = v - vsf;
        if(sextant == 0) {
            r = v;
            g = mid1;
            b = m;
        } else if(sextant == 1) {
            r = mid2;
            g = v;
            b = m;
        } else if(sextant == 2) {
            r = m;
            g = v;
            b = mid1;
        } else if(sextant == 3) {
            r = m;
            g = mid2;
            b = v;
        } else if(sextant == 4) {
            r = mid1;
            g = m;
            b = v;
        } else if(sextant == 5) {
            r = v;
            g = m;
            b = mid2;
        }
    }
    return vec3(r, g, b);
}

vec3 hueshift(float dh, vec3 color) {
  vec3 hsl = rgb2hsl(color);
  hsl.x = fract(hsl.x + dh);
  return hsl2rgb(hsl);
}

vec2 polar(vec2 p) {
    if(p.x == 0.0 && p.y == 0.0) {
        return vec2(0.0, 0.0);
    } else {
        return vec2(atan(p.y, p.x), length(p));
    }
}

vec2 cartesian(vec2 p) {
    return vec2(p.y * cos(p.x), p.y * sin(p.x));
}


float map(float l0, float r0, float l1, float r1, float x) {
    return (x - l0) / (r0 - l0) * (r1 - l1) + l1;
}

float round(float x) {
    return floor(x + 0.5);
}

int min(int x, int y) {
    return x < y ? x : y;
}

float analysis_value(int i, float u) {
    float half_px_h = 0.5/analysis_resolution.y;
    float v = map(0.0, analysis_resolution.y - 1.0, half_px_h, 1.0-half_px_h, float(i));
    return map(0.0, 1.0, -1.0, 1.0, texture2D(analysis, vec2(u, v)).r) * 4.0;
}

float gain_value(int i) {
    float half_px_w = 0.5/analysis_resolution.x;
    float half_px_h = 0.5/analysis_resolution.y;
    float u = half_px_w;
    float v = map(0.0, analysis_resolution.y - 1.0, half_px_h, 1.0-half_px_h, float(i));
    return map(0.0, 1.0, 0.0, 1.0, texture2D(analysis, vec2(u, v)).g);
}

vec3 analysis_color(int i, vec2 uv, float k) {
    float v_bi = map(0.0, 1.0, 1.0, -1.0, uv.y) + 1.0;

    float val = analysis_value(i, uv.x);
    float gain = gain_value(i);
    /*if(distance(v_bi, drums_val) < k) {
        return vec3(gain);
    } else {
        return vec3(0.0);
    }*/

    float v_min = min(0.0, val);
    float v_max = max(0.0, val);
    
    if(v_min <= v_bi && v_bi <= v_max) {
        float k_thr = pow(clamp(map(0.0, 0.025, 0.0, 1.0, abs(val)), 0.0, 1.0), 3.0);
        float k_fade = pow(abs(v_bi/val), 3.0);
        return vec3(gain/**k_thr*k_fade*/);
    } else {
        return vec3(0.0);
    }
}

void main() {
    vec2 uv = vTexCoord;
    float k = 3.0 / resolution.y;
    float aspect = resolution.x/resolution.y;

    /*vec2 uv_bi = uv * 2.0 - 1.0;
    vec2 uv_bi_p = polar(uv_bi);
    vec2 bg_uv_bi_p = uv_bi_p * vec2(1.0, 0.95);
    bg_uv_bi_p = bg_uv_bi_p + vec2(bg_uv_bi_p.y * 0.05, 0.0);
    vec2 bg_uv_bi = cartesian(bg_uv_bi_p);
    vec2 bg_uv = (bg_uv_bi + 1.0) * 0.5;*/

    float k1_u = 36.0 * aspect;
    float k1_v = 15.0;
    float n1 = cnoise(vec3(uv.y * k1_v * aspect + 3.3*time, uv.x * k1_u, time*0.8));
    float k2_u = 4.0 * aspect;
    float k2_v = 4.0;
    float n2 = cnoise(vec3(-time*100.0, uv.x * k2_u, uv.y * k2_v));
    vec2 d_uv = cartesian(vec2(map(0.0, 1.0, 0.0, TAU, n1) - TAU*0.25, map(0.0, 1.0, -0.009, 0.009, n2)));
    
    vec2 bg_uv = clamp(uv + d_uv, 0.0, 1.0);
    
    vec3 bg_color = hueshift(0.0005, texture2D(background, bg_uv).rgb) * 0.985;
    vec3 fg_color =
        analysis_color(0, uv, k) * vec3(1.0, 0.0, 0.0) +
        analysis_color(1, uv, k) * vec3(0.5) +
        analysis_color(2, uv, k) * vec3(0.0, 1.0, 0.0) +
        analysis_color(3, uv, k) * vec3(0.0, 0.0, 1.0);
    
    vec3 color = clamp(bg_color + fg_color*0.35, 0.0, 1.0);
        
    gl_FragColor = vec4(color, 1.0);;
}
