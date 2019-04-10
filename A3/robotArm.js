"use strict";

var canvas, gl, program;

var NumVertices = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)

var points = [];
var colors = [];

var vertices = [
    vec4(-0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, 0.5, 0.5, 1.0),
    vec4(0.5, 0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
    vec4(-0.5, -0.5, -0.5, 1.0),
    vec4(-0.5, 0.5, -0.5, 1.0),
    vec4(0.5, 0.5, -0.5, 1.0),
    vec4(0.5, -0.5, -0.5, 1.0)
];

// RGBA colors
var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(1.0, 1.0, 1.0, 1.0),  // white
    vec4(0.0, 1.0, 1.0, 1.0)   // cyan
];


// Parameters controlling the size of the Robot's arm
var vPosition;
var vColor;
var BASE_HEIGHT = 2.0;
var BASE_WIDTH = 5.0;
var LOWER_ARM_HEIGHT = 5.0;
var LOWER_ARM_WIDTH = 0.5;
var UPPER_ARM_HEIGHT = 5.0;
var UPPER_ARM_WIDTH = 0.5;
var circle = {
    draw: false,
    exists: 1,
    vertices: [],
    colors: [],
    x: 0,
    y: 0,
    draw: function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, circleVBuff);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, circleCBuff);
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vColor);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(translate(circle.x, circle.y, 0.0)));
        gl.drawArrays(gl.LINE_STRIP, 0, circle.vertices.length / 4);
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vColor);
    }
}
var vertexCount = 100;
var radius = 0.25;
for (var i = 0; i < vertexCount; i++) {
    circle.colors.push(vec4(1.0, 1.0, 1.0, 1.0));
    circle.vertices.push(radius * Math.cos((i / vertexCount) * 2.0 * Math.PI));
    circle.vertices.push(radius * Math.sin((i / vertexCount) * 2.0 * Math.PI));
    circle.vertices.push(0.0);
    circle.vertices.push(1.0);

}


// Shader transformation matrices

var modelViewMatrix, projectionMatrix, inP;

// Array of rotation angles (in degrees) for each rotation axis

var Base = 0;
var LowerArm = 1;
var UpperArm = 2;


var theta = [0, 0, 0];
var tarTheta=[0,0,0];
var angle = 0;

var modelViewMatrixLoc;

var vBuffer, cBuffer, circleVBuff, circleCBuff;
var corners = [];
window.addEventListener("keydown", getKey, false);
var circling=false;
function getKey(key) {
	// switch (key.key) {
	// 	case "p":
	// 		if (circling == true) {
	// 			circling = false;
	// 		}
	// 		else {
	// 			circling = true;
	// 		}
    //         break;
    //     }
    }
window.addEventListener("mousedown", function (e) {
    switch (e.button) {
        case 0:
            
            var obj = canvas;
            var obj_left = 0;
            var obj_top = 0;
            var xpos;
            var ypos;
            while (obj.offsetParent) {
                obj_left += obj.offsetLeft;
                obj_top += obj.offsetTop;
                obj = obj.offsetParent;
            }
            if (e) {
                //FireFox
                xpos = e.pageX;
                ypos = e.pageY;
            }
            else {
                //IE
                xpos = window.event.x + document.body.scrollLeft - 2;
                ypos = window.event.y + document.body.scrollTop - 2;
            }
            xpos -= obj_left;
            ypos -= obj_top;
            //console.log(xpos + ", " + ypos);
            if(!(xpos<0||xpos>canvas.width||ypos<0||ypos>canvas.height)){
            circle.x=xpos/canvas.height-0.5;
            circle.y=ypos/canvas.height-0.5;
            //console.log(circle.x + ", " + circle.y);
            var point= vmMult(vec4(circle.x,circle.y,0,1),inP);
            //console.log(point[0]/point[4]+" : "+point[1]);
            circle.x=2*point[0];
            circle.y=-2*point[1];
            toPoint();
            }
            break;
    }
}, false);
function vmMult(vec, mat) {
    var x = 0;
    var y = 0;
    var z = 0;
    var w = 0;
    var r;
    for (i = 0; i < 4; i++) {
        r = mult(mat[i], vec);
        x += r[0];
        y += r[1];
        z += r[2];
        w += r[3];
    }
    return vec4(x, y, z, w);

}
//----------------------------------------------------------------------------

function quad(a, b, c, d) {
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[b]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[a]);
    colors.push(vertexColors[a]);
    points.push(vertices[c]);
    colors.push(vertexColors[a]);
    points.push(vertices[d]);
}


function colorCube() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

//____________________________________________

// Remmove when scale in MV.js supports scale matrices

function scale4(a, b, c) {
    var result = mat4();
    result[0][0] = a;
    result[1][1] = b;
    result[2][2] = c;
    return result;
}


//--------------------------------------------------

function toPoint(){
    var maxdist=LOWER_ARM_HEIGHT+UPPER_ARM_HEIGHT;
    maxdist=maxdist
    var dist=Math.pow(0-circle.x,2)+Math.pow(BASE_HEIGHT-circle.y,2);
    dist=Math.sqrt(dist);
   // console.log(dist);
    var r0=LOWER_ARM_HEIGHT;
    var armL=UPPER_ARM_HEIGHT+LOWER_ARM_HEIGHT;
    var d1;
    var dh;
    var x2,y2,x3,y3;
    if(dist>maxdist){
        var normX=normalize(vec2(circle.x,circle.y));
        circle.x=0.9999*maxdist*normX[0];
        circle.y=0.9999*maxdist*normX[1]+BASE_HEIGHT;
        dist=Math.pow(0-circle.x,2)+Math.pow(BASE_HEIGHT-circle.y,2);
        dist=Math.sqrt(dist);
    }
    if(dist<=maxdist){
        d1=(dist)/(2);
        dh=Math.sqrt(r0*r0-d1*d1);
        x2=(circle.x)/2;
        y2=BASE_HEIGHT+(circle.y-BASE_HEIGHT)/2;
        x3=x2+dh*(circle.y-BASE_HEIGHT)/dist;
        y3=y2-dh*(circle.x)/dist;
        // console.log("CIRCLE LOC "+circle.x+" : "+circle.y);
        // console.log(x2+" : "+y2);
        var p=vec2(x3,y3-BASE_HEIGHT);
        var pc=vec2(circle.x,circle.y);
        var lowerp=vec2(0,LOWER_ARM_HEIGHT) 
        var lAngle=Math.acos(dot(p,lowerp)/(length(lowerp)*length(p)));
        if(p[1]<lowerp[1]){

           lAngle=-lAngle;  
           if(p[0]<lowerp[0]){
               lAngle=-lAngle;
           }          
        }
        var p=vec2(x3,y3);
        var ptoc=subtract(pc,p);
        var upperp=vec2(Math.sin(-lAngle)*UPPER_ARM_HEIGHT,Math.cos(lAngle)*UPPER_ARM_HEIGHT);
        var lowerp=vec2(Math.sin(-lAngle)*UPPER_ARM_HEIGHT,Math.cos(lAngle)*UPPER_ARM_HEIGHT+BASE_HEIGHT);
        console.log(lowerp);
        console.log("P: "+p);
        var ptor=upperp;
        //var ptor=subtract(upperp,p);
        var uAngle=Math.acos(dot(ptoc,ptor)/(length(ptoc)*length(ptor)));
        uAngle=degrees(uAngle);
        console.log("UPPER ANGLE: " +uAngle);
        lAngle=degrees(lAngle);
        console.log("LOWER ANGLE: " +lAngle);
        tarTheta[0]=0;
        tarTheta[LowerArm]=lAngle;
        tarTheta[UpperArm]=uAngle;


    }
}
function degrees( radians ) {
    return radians* 180.0 / Math.PI ;
}
window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");

    gl.useProgram(program);

    colorCube();

    // Load shaders and use the resulting shader program

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Create and initialize  buffer objects
    circleVBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circleVBuff);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(circle.vertices), gl.STATIC_DRAW);

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    circleCBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circleCBuff);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(circle.colors), gl.STATIC_DRAW);
    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    document.getElementById("slider1").onchange = function (event) {
        theta[0] = parseInt(event.target.value);
        tarTheta[0]=theta[0];
        console.log(theta[0]);
    };
    document.getElementById("slider2").onchange = function (event) {
        theta[1] = parseInt(event.target.value);
        tarTheta[1]=theta[1];
        console.log(theta[1]);
    };
    document.getElementById("slider3").onchange = function (event) {
        theta[2] = parseInt(event.target.value);
        tarTheta[2]=theta[2];
        console.log(theta[2]);
    };

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    var orthoedge=13;
    projectionMatrix = ortho(-orthoedge, orthoedge, -orthoedge, orthoedge, -orthoedge, orthoedge);
    inP = inverse4(projectionMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

    render();
}

//----------------------------------------------------------------------------


function base() {
    var s = scale4(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * BASE_HEIGHT, 0.0), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

//----------------------------------------------------------------------------


function upperArm() {
    var s = scale4(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

//----------------------------------------------------------------------------


function lowerArm() {
    var s = scale4(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
    var instanceMatrix = mult(translate(0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(t));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

//----------------------------------------------------------------------------


var render = function () {
    for(i=0;i<3;i++){
        if(theta[i]!=tarTheta[i]){
        theta[i]+=(tarTheta[i]-theta[i])/(1+Math.abs(tarTheta[i]-theta[i]));  
        //console.log("theta "+i+": "+theta[i])
        }
    }
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (circle.exists == 1) {
        circle.draw();
    }
    modelViewMatrix = rotate(theta[Base], 0, 1, 0);
    base();

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, BASE_HEIGHT, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[LowerArm], 0, 0, 1));
    lowerArm();

    modelViewMatrix = mult(modelViewMatrix, translate(0.0, LOWER_ARM_HEIGHT, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[UpperArm], 0, 0, 1));
    upperArm();
    if (circle.exists == 1) {
        circle.draw();
    }
    requestAnimFrame(render);
}
