"use strict";

var canvas, gl, program, program2, program3;
var pirate;
var NumVertices;
var models = [];
var textures = [];
var image;
var texture, texture2, texture3, texture4;
var texw, texh;
var texCount;
function model(verts, norms, texCoord, fIndex, indexCount) {
    this.vertices = verts;
    this.normals = norms;
    this.fnormals = [];
    this.texCoord = texCoord;
    this.fIndex = fIndex;
    this.indexCount = indexCount;
    this.texture = null;
    this.mat = scalem(1, 1, 1);
    this.rot = 0;//Math.random()*360;
    this.rotd = 0;
}
// Parameters controlling the size of the Robot's arm
var vPosition;
var vColor;
var vNorm, texCoord;

// Shader transformation matrices
var cam = {
    x: 0,
    y: 0,
    z: 0
}

var modelMatrix, projectionMatrix, inP, viewM, camRot = rotate(15, vec3(1, 0, 0)), camTran = translate(cam.x, cam.y, cam.z);
var defat = vec3(0, 0, 0), defeye = vec3(0, 0, 1), deffovy = 90, defup = vec3(0, 1, 0), defaspect = 1;
var at = vec3(defat), eye = vec3(defeye), fovy = parseFloat(deffovy), up = vec3(defup), aspect = parseFloat(defaspect);
var camR = length(subtract(at, eye));
var thetaCamX = 0;
var thetaCamY = 0;
var zoom = -38;


var modelMatrixLoc, viewMatrixLoc;

var iBuffer, vBuffer, cBuffer, nBuffer, texBuffer, planeVbuf, planeTbuf;
var frameBuffer;
var planetex = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 1),
    vec2(1, 0),
    vec2(0, 0)
];

var planevert = [
    vec2(-1, -1),
    vec2(-1, 1),
    vec2(1, 1),
    vec2(1, 1),
    vec2(1, -1),
    vec2(-1, -1)
];

function vmMult(vec, mat) {
    var x = 0;
    var y = 0;
    var z = 0;
    var w = 0;
    var r;
    for (var i = 0; i < 4; i++) {
        r = mult(mat[i], vec);
        x += r[0];
        y += r[1];
        z += r[2];
        w += r[3];
    }
    return vec4(x, y, z, w);

}
//----------------------------------------------------------------------------
function parseObj(obj) {
    var vertices = [];
    var normals = [];
    var texCoord = [];
    var fIndex = [];
    var lines = obj.split("\n");// each line of file
    var subline = []; //split lines
    var quad;// for square stuff
    var tempVerts = [];
    var tempText = [];
    var tempNorm = [];
    var Cache = [];
    var vdat = [];//face data
    var ind;//index
    var logged = false;
    var tindexCount = 0;
    for (var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].trim();
        switch (lines[i][0]) {
            case "v":
                subline = lines[i].split(" ");
                subline.shift();
                if (isNaN(parseFloat(subline[0]))) {
                    subline.shift();
                }
                switch (lines[i].charAt(1)) {
                    case " ":
                        tempVerts.push(parseFloat(subline[0]), parseFloat(subline[1]), parseFloat(subline[2]));

                        break;
                    case "t":
                        tempText.push(parseFloat(subline[0]), parseFloat(subline[1]));
                        break;
                    case "n":
                        tempNorm.push(parseFloat(subline[0]), parseFloat(subline[1]), parseFloat(subline[2]));
                        break;
                }
                break;
            case "f":
                subline = lines[i].split(" ");
                subline.shift();
                quad = false;
                for (var j = 0; j < subline.length; j++) {
                    if (j == 3 && !quad) {
                        j = 2
                        quad = true;
                    }
                    if (subline[j] in Cache) {
                        fIndex.push(Cache[subline[j]]);
                    } else {
                        vdat = subline[j].split("/");

                        ind = (parseInt(vdat[0]) - 1) * 3;
                        vertices.push(tempVerts[ind], tempVerts[ind + 1], tempVerts[ind + 2])
                        ind = (parseInt(vdat[2]) - 1) * 3;
                        normals.push(tempNorm[ind], tempNorm[ind + 1], tempNorm[ind + 2]);

                        if (vdat[1] != "") {
                            ind = (parseInt(vdat[1]) - 1) * 2;
                            texCoord.push(tempText[ind], tempText[ind + 1]);
                        }
                        Cache[subline[j]] = tindexCount;
                        fIndex.push(tindexCount);
                        tindexCount++;
                    }
                    if (j == 3 && quad) {
                        fIndex.push(Cache[subline[0]]);
                    }

                }
                break;

        }


    }


    var newm = new model(vertices, normals, texCoord, fIndex, tindexCount);
    //getFnorms(newm);
    models.push(newm);

}
function importObj(file) {
    console.log(file);
    var file = file.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
        var contents = e.target.result;
        parseObj(contents);


    };
    reader.readAsText(file);
}
function loadObj(obj) {
    const fileUrl = obj; // provide file location
    fetch(fileUrl)
        .then(r => r.text())
        .then(t => parseObj(t))
}
var mouseX = 0, mouseY = 0;
var prevX = 0, prevY = 0;
var lMouse = false;
var rMouse = false;
var texExist = false;
window.addEventListener("keydown", getKey, false);
var speed = 0.01;
var forward = 0;
var looking = 0;
var lighton = false;
function getKey(key) {
    switch (key.key) {
        case "c":


            models.push(new model(models[0].vertices, models[0].normals, models[0].texCoord, models[0].fIndex, models[0].indexCount));
            //models[models.length - 1].mat = translate(0, 0, -models.length + 1);


            break;
        case "d":

            if (models.length > 1) {
                models.pop(models.length - 1);
            }
            //models[models.length - 1].mat = translate(0, 0, -models.length + 1);


            break;
        case "p":

            lighton = true;
            tarCol = vec3(secCol);
            break;
        case "o":

            lighton = false;
            tarCol = vec3(0, 0, 0);
            break;
        case "ArrowUp":
            zoom += 1;
            if (zoom > 0) {
                zoom = 0;
            }
            viewM = lookAt(eye, at, up);
            viewM = mult(viewM, translate(0, 0, zoom));

            break;
        case "ArrowDown":
            zoom -= 1;
            if (zoom > 0) {
                zoom = 0;
            }
            viewM = lookAt(eye, at, up);
            viewM = mult(viewM, translate(0, 0, zoom));


            break;
        case "r":
            camRot = rotate(15, vec3(1, 0, 0));
            eye = vec3(defeye);
            at = vec3(defat);
            zoom = -38;
            viewM = lookAt(eye, at, up);
            viewM = mult(viewM, translate(0, 0, zoom));
            lighton = false;
            tarCol = vec3(0, 0, 0);
            cam.x = 0;
            cam.y = 0;
            cam.z = 0;
            thetaCamX = 0;
            thetaCamY = 0;

            break;

    }
}
window.addEventListener("keyup", getKeyUp, false);
function getKeyUp(key) {
    switch (key.key) {

    }
}
window.addEventListener("mousedown", function (e) {
    switch (e.button) {
        case 0:
            lMouse = true;
            prevX = mouseX;
            prevY = mouseY;
            break;
        case 1:
            rMouse = true;
            break;

    }
}, false);
window.addEventListener("mouseup", function (e) {
    switch (e.button) {
        case 0:
            lMouse = false;
            break;
        case 2:
            rMouse = false;
            break;
    }
}, false);
window.addEventListener("wheel", function (e) {
    zoom += 10 * e.deltaY / canvas.height;
    if (zoom > 0) {
        zoom = 0;
    }
    viewM = lookAt(eye, at, up);
    viewM = mult(viewM, translate(0, 0, zoom))

}, false);
window.addEventListener("mousemove", function (e) {

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
    if (!(xpos < 0 || xpos > canvas.width || ypos < 0 || ypos > canvas.height)) {
        mouseX = xpos / canvas.width - 0.5;
        mouseY = ypos / canvas.height - 0.5;
        if (lMouse) {
            var dxtheta = mouseX - prevX;
            var dytheta = mouseY - prevY;
            dxtheta = dxtheta * 360;
            dytheta = dytheta * 360;
            var camRotx = rotate(dxtheta, vec3(0, 1, 0));
            var camRoty = rotate(dytheta, vec3(1, 0, 0));
            camRot = mult(camRoty, camRot);
            camRot = mult(camRotx, camRot);
            prevX = mouseX;
            prevY = mouseY;



        }
        if (rMouse) {



        }

    }
});
//____________________________________________


//--------------------------------------------------
function makeCanvasFullScreen(canvas) {
    var b = document.body;
    var d = document.documentElement;
    var fullw = Math.max(b.clientWidth, b.scrollWidth, d.scrollWidth, d.clientWidth);
    var fullh = Math.max(b.clientHeight, b.scrollHeight, d.scrollHeight, d.clientHeight);
    canvas.width = fullw * 0.97;
    canvas.height = fullh * 0.96 - 30;
}

function degrees(radians) {
    return radians * 180.0 / Math.PI;
}
window.onload = function init() {
    // document.getElementById('file-input')
    //     .addEventListener('change', importObj, false);

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }
    makeCanvasFullScreen(canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");

    gl.useProgram(program);

    // Load shaders and use the resulting shader program

    program2 = initShaders(gl, "vertex-shader2", "fragment-shader2");
    //gl.useProgram(program2);
    program3 = initShaders(gl, "vertex-shader3", "fragment-shader3");
    // Create and initialize  buffer objects

    vBuffer = gl.createBuffer();
    texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);

    iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);

    // Create and bind the framebuffer
    // const fb = gl.createFramebuffer();
    // gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // // attach the texture as the first color attachment
    // const attachmentPoint = gl.COLOR_ATTACHMENT0;
    // gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, tex, level);

    vNorm = gl.getAttribLocation(program, "normals");
    gl.vertexAttribPointer(vNorm, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNorm);


    texCoord = gl.getAttribLocation(program, "texCoord")

    cBuffer = gl.createBuffer();


    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");

    viewM = lookAt(eye, at, up);
    viewM = mult(viewM, translate(0, 0, zoom))
    viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");


    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewM));
    projectionMatrix = perspective(fovy, gl.canvas.width / gl.canvas.height, .01, 1000);
    inP = inverse4(projectionMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));

    //console.log(pirate)

    // Create a texture.
    texw = canvas.width;
    texh = canvas.height;
    texture = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([255, 0, 255, 255]);  // opaque blue
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        width, height, border, srcFormat, srcType,
        pixel);
    texture2 = gl.createTexture();
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture2);

    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        texw, texh, border, srcFormat, srcType,
        null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    texture3 = gl.createTexture();
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture3);

    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        texw, texh, border, srcFormat, srcType,
        null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    texture4 = gl.createTexture();
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture4);

    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        texw, texh, border, srcFormat, srcType,
        null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        var yarr=true;
    // Asynchronously load an image
    image = new Image();
    image.src = "pirate_girl.png";

    loadObj("pirate_girl.obj");

    image.onload = function () {
        console.log("uwu");
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            srcFormat, srcType, image);

        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.useProgram(program);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            var u_image0Location = gl.getUniformLocation(program, "img0");
            gl.uniform1i(u_image0Location, 0);  // texture unit 0
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
        }
        texExist = true;
        //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    };


    frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture2, level);
    //gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT1,gl.TEXTURE_2D,texture2,level);
    // create a depth renderbuffer
    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

    // make a depth buffer and the same size as the targetTexture
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, texw, texh);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    gl.uniform3fv(gl.getUniformLocation(program, "camPos"), flatten(eye));
    var attachments = [gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1];

    var pl = vec3(0, 0, 0);
    gl.uniform3fv(gl.getUniformLocation(program, "pLposit"), flatten(pl));
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "pLtrans"), 0, flatten(translate(0, 0, zoom)));
    gl.blendFunc(gl.ONE, gl.ONE);
    document.getElementById("slider1").onchange = function (event) {
        secCol[0] = parseFloat(event.target.value);
        console.log("r");
    };
    document.getElementById("slider2").onchange = function (event) {
        secCol[1] = parseFloat(event.target.value);
        console.log("g");
    };
    document.getElementById("slider3").onchange = function (event) {
        secCol[2] = parseFloat(event.target.value);

    };
    document.getElementById("slider4").onchange = function (event) {
        colorCycle = parseFloat(event.target.value);
    };
    morep();
    if(!yarr){
    render();
    }else{
        pirate();
    }
}
function pirate(){
    gl.useProgram(program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawModels(0,true);
    requestAnimationFrame(pirate);
}


function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}
var t = 1;

var curCol = vec3(0.0, 0.0, 0.0);
var tarCol = vec3(0.0, 0.0, 0.0);
var secCol = vec3(0.0, 0.3, 0.3);
var bloomN = 2;
var ontime = 0;
var maxOn = 100;
var colorCycle = 0;
var render = function () {
    if(colorCycle>0.2){
    secCol[0] = (Math.sin(.01 * tcount + 0) * .5 + .5);
    secCol[1] = (Math.sin(.01 * tcount + 2) * .5 + .5);
    secCol[2] = (Math.sin(.01 * tcount + 4) * .5 + .5);
    secCol[0] %= 1.0;
    secCol[1] %= 1.0;
    secCol[2] %= 1.0;
    }
    if (lighton) {
        tarCol = vec3(secCol);
    }
    tcount += 1;
    tcount = tcount % numpoints;
    if (lighton) {
        if (bloomN < 12) {
            bloomN += .1;
        }
        if (ontime < maxOn) {
            ontime += 1;
        }



    } else {
        if (bloomN > 2) {
            bloomN *= ontime / maxOn;
        }
        if (ontime > 0) {
            ontime -= 1;
        }
    }
    if (curCol[0] < tarCol[0]) {
        curCol[0] += 0.001;
    }
    if (curCol[1] < tarCol[1]) {
        curCol[1] += 0.001;
    }
    if (curCol[2] < tarCol[2]) {
        curCol[2] += 0.001;
    }
    if (curCol[0] > tarCol[0]) {
        curCol[0] -= 0.01;
    }
    if (curCol[1] > tarCol[1]) {
        curCol[1] -= 0.01;
    }
    if (curCol[2] > tarCol[2]) {
        curCol[2] -= 0.01;
    }
    var flag = true;
    gl.useProgram(program);
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewM));

    gl.uniform3fv(gl.getUniformLocation(program, "myCol"), curCol);

    if (models.length < 32) {
        for (var i = 0; i < 31 && i < models.length; i++) {
            models.push(new model(models[0].vertices, models[0].normals, models[0].texCoord, models[0].fIndex, models[0].indexCount));
        }
    }
    // var tzoom = zoom;

    // zoom = -4;

    // var tcamRot = camRot;
    // camRot = mat4();
    // gl.uniform1f(gl.getUniformLocation(program, "time"), t);
    // gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    // gl.bindTexture(gl.TEXTURE_2D, texture);
    // gl.viewport(0, 0, 1024, 1024);
    // aspect = 1.0;
    // gl.clearColor(0, 0, 0, 1);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // drawModels(0, true);
    // camRot = tcamRot;
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    //zoom = tzoom;
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 1.0);

    gl.uniform1i(gl.getUniformLocation(program, "mode"), 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer); //not canvas.. use temp frame buffer    
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture2, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.viewport(0, 0, texw, texh);
    aspect = texw / texh;
    //drawModels(0,true);
    drawModels(0, true);
    gl.clearColor(0, 0, 0, 0);


    gl.uniform1i(gl.getUniformLocation(program, "mode"), 1);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture3, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //drawModels(0,true);
    drawModels(0, true);

    gl.useProgram(program2);

    gl.useProgram(program2);
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(planevert), gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl.getAttribLocation(program2, "vPosition"), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program2, "vPosition"));
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(planetex), gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl.getAttribLocation(program2, "texCoord"), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program2, "texCoord"));
    gl.uniform1f(gl.getUniformLocation(program2, "cwidth"), canvas.width);
    gl.uniform1f(gl.getUniformLocation(program2, "cheight"), canvas.height);

    gl.useProgram(program3);
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(planevert), gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl.getAttribLocation(program3, "vPosition"), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program3, "vPosition"));
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(planetex), gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl.getAttribLocation(program3, "texCoord"), 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program3, "texCoord"));
    gl.uniform1f(gl.getUniformLocation(program3, "cwidth"), canvas.width);
    gl.uniform1f(gl.getUniformLocation(program3, "cheight"), canvas.height);

    gl.useProgram(program2);
    gl.disable(gl.DEPTH_TEST);
    //BLOOM w/e number times

    for (var i = 0; i < bloomN; i++) {


        if (flag) {
            gl.bindTexture(gl.TEXTURE_2D, texture3);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture4, 0);

        }
        else {
            gl.bindTexture(gl.TEXTURE_2D, texture4);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture3, 0);
        }
        flag = !flag;
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    gl.clearColor(0, 0, 0, 1.0);


    //render to canvas
    gl.useProgram(program3);
    gl.enable(gl.BLEND);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (flag) {
        gl.bindTexture(gl.TEXTURE_2D, texture4);
    }
    else {
        gl.bindTexture(gl.TEXTURE_2D, texture3);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disable(gl.BLEND);
    requestAnimFrame(render);

}
var getFnorms = function (model) {
    var fnorm;
    var p1;
    var p2;
    var p3;
    for (var i = 0; i < model.fIndex.length; i += 3) {
        p1 = vec3(model.vertices[model.fIndex[i] * 3], model.vertices[model.fIndex[i] * 3 + 1], model.vertices[model.fIndex[i] * 3 + 2]);
        p2 = vec3(model.vertices[model.fIndex[i + 1] * 3], model.vertices[model.fIndex[i + 1] * 3 + 1], model.vertices[model.fIndex[i + 1] * 3 + 2]);
        p3 = vec3(model.vertices[model.fIndex[i + 2] * 3], model.vertices[model.fIndex[i + 2] * 3 + 1], model.vertices[model.fIndex[i + 2] * 3 + 2]);
        if (i < 3) {
            console.log(p1 + "\n" + p2 + "\n" + p3);
        }
        fnorm = vec3(cross(subtract(p3, p2), subtract(p1, p2)));
        // fnorm = vec3(model.normals[model.fIndex[i]*3],model.normals[model.fIndex[i]*3+1],model.normals[model.fIndex[i]*3+2]);
        fnorm = normalize(fnorm);
        if (i < 6) {
            console.log(fnorm);
        }
        for (var j = 0; j < 3; j++) {
            model.fnormals[model.fIndex[i + j] * 3] = fnorm[0];
            model.fnormals[model.fIndex[i + j] * 3 + 1] = fnorm[1];
            model.fnormals[model.fIndex[i + j] * 3 + 2] = fnorm[2];
        }
    }
}
var points = []; // DO POINTS
var numpoints = 65536;
var zthta = 30;
var spRad = 6;
var pmult = 318;
function morep() {
    for (var i = 0; i < numpoints; i++) {
        var t = pmult * Math.PI * i / numpoints;;
        var yt = spRad * (Math.sin(zthta) * Math.cos((Math.cos(zthta)) * t / (1 - Math.cos(zthta))));// 0.1 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        var xt = spRad * (0.5 * (1 + Math.cos(zthta)) * Math.cos(t) - 0.5 * (1 - Math.cos(zthta)) * Math.cos((Math.cos(zthta) + 1) * t / (1 - Math.cos(zthta))));//0.1 * (16 * Math.pow(Math.sin(t), 3));
        var zt = spRad * (0.5 * (1 + Math.cos(zthta)) * Math.sin(t) - 0.5 * (1 - Math.cos(zthta)) * Math.sin((Math.cos(zthta) + 1) * t / (1 - Math.cos(zthta))));//0;
        points[i] = [xt, yt, zt];
    }
    while (!threshold()) {
        pmult += 1;
        for (var i = 0; i < numpoints; i++) {
            var t = pmult * Math.PI * i / numpoints;;
            var yt = spRad * (Math.sin(zthta) * Math.cos((Math.cos(zthta)) * t / (1 - Math.cos(zthta))));// 0.1 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            var xt = spRad * (0.5 * (1 + Math.cos(zthta)) * Math.cos(t) - 0.5 * (1 - Math.cos(zthta)) * Math.cos((Math.cos(zthta) + 1) * t / (1 - Math.cos(zthta))));//0.1 * (16 * Math.pow(Math.sin(t), 3));
            var zt = spRad * (0.5 * (1 + Math.cos(zthta)) * Math.sin(t) - 0.5 * (1 - Math.cos(zthta)) * Math.sin((Math.cos(zthta) + 1) * t / (1 - Math.cos(zthta))));//0;
            points[i] = [xt, yt, zt];
        }
    }
}
function threshold() {
    var xd = points[0][0] - points[numpoints - 1][0];
    var yd = points[0][1] - points[numpoints - 1][1];
    var zd = points[0][2] - points[numpoints - 1][2];
    if (Math.abs(xd) > .1) {
        return false;
    }
    if (Math.abs(yd) > .1) {
        return false;
    }
    if (Math.abs(zd) > .1) {
        return false;
    }
    return true;
}
var tcount = 0;
var drawModels = function (num, path) {


    //camRot = mult(rotate(1, vec3(1, 0, 0)),camRot);
    //camRot = mult(rotate(1.5, vec3(0, 1, 0)),camRot);
    // camRot = mult(rotate(0, vec3(0, 0, 1)),camRot);


    var lim = num;
    if (lim == 0 || lim > models.length) {
        lim = models.length;
    }

    projectionMatrix = perspective(fovy, aspect, .01, 1000);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));
    for (var i = 0; i < lim; i++) {
        var xt = 0, yt = 0, zt = 0;
        if (path) {
            var t = ((tcount + i * Math.ceil((numpoints - 1) / models.length)) % numpoints);
            xt =  2 * (1 + i % Math.floor(Math.sqrt(models.length))) * Math.cos(i * 2 * Math.PI / models.length) * (1 - ontime / maxOn) +  (1 + i % 4) * points[t][0] * (ontime / maxOn);
            yt =  (1 + i % 4) * points[t][1] * (ontime / maxOn) * (ontime / maxOn);
            zt =  2 * (1 + i % Math.floor(Math.sqrt(models.length))) * Math.sin(i * 2 * Math.PI / models.length) * (1 - ontime / maxOn) +  (1 + i % 4) * points[t][2] * (ontime / maxOn);
        }
        var curr = models[i];
        if (lighton) {
            curr.rotd = curr.rot;
            curr.rot += Math.random() / 5;
            curr.rot = curr.rot % 360;
        } else if (curr.rot > 0) {
            curr.rot -= curr.rotd / 200;
        }
        //curr.mat = scalem(0.1, 0.1, 0.1);
        //var scale=16/models.length;
        curr.mat = mult(rotate(curr.rot, vec3(0, 1, 0)), mat4());
        curr.mat = mult(rotate(2 * curr.rot, vec3(1, 0, 0)), curr.mat);
        curr.mat = mult(rotate(4 * curr.rot, vec3(0, 0, 1)), curr.mat);
        curr.mat = mult(translate(xt, yt, zt), curr.mat);
        curr.mat = mult(camRot, curr.mat);

        modelMatrix = curr.mat;

        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(curr.vertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(curr.fIndex), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(curr.normals), gl.STATIC_DRAW);
        gl.vertexAttribPointer(vNorm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNorm);

        if (texExist) {
            gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, flatten(curr.texCoord), gl.STATIC_DRAW);
            gl.vertexAttribPointer(texCoord, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(texCoord);
        }
        gl.drawElements(gl.TRIANGLES, curr.fIndex.length, gl.UNSIGNED_SHORT, 0);
    }
}
