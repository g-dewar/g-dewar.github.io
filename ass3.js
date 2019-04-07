"use strict";

var canvas, gl, program;
var pirate;
var NumVertices;
var models = [];
var image;
function model(verts, norms, texCoord, fIndex, indexCount) {
    this.vertices = verts;
    this.normals = norms;
    this.fnormals = [];
    this.texCoord = texCoord;
    this.fIndex = fIndex;
    this.indexCount = indexCount;
}
// Parameters controlling the size of the Robot's arm
var vPosition;
var vColor;
var vNorm, texCoord;

// Shader transformation matrices

var modelViewMatrix, projectionMatrix, inP;



var modelViewMatrixLoc;

var iBuffer, vBuffer, cBuffer, nBuffer, texBuffer;
window.addEventListener("keydown", getKey, false);
var circling = false;
function getKey(key) {
    switch (key.key) {
        case "p":
            console.log(vertices.length / 3);
            console.log(texCoord.length / 2);
            console.log(normals.length / 3);

            break;
    }
}
window.addEventListener("mousedown", function (e) {
    switch (e.button) {
        case 0:
            lMouse = true;
            console.log(vec2(mouseX, mouseY));
            break;
        case 1:
            rMouse = true;
            break;

    }
}, false);
window.addEventListener("mouseup",function(e){
	switch (e.button){
		case 0:
		lMouse = false;
		break;
		case 2:
		rMouse = false;
		break;
	}
},false);
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
                            texCoord.push(tempText[ind], tempText[ind + 1], tempText[ind + 2])
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
var mouseX, mouseY;
var lMouse = false;
var rMouse = false;
var texExist=false;
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
            if(!(xpos<0||xpos>canvas.width||ypos<0||ypos>canvas.height)){
            mouseX=xpos/canvas.width-0.5;
            mouseY=ypos/canvas.height-0.5;
    if (lMouse) {
        
        // mouseX =  (e.clientX/ canvas.width-0.5);
        // mouseY = -((e.clientY / canvas.height)-0.5);
        
    }
    if (rMouse) {



    }

}});
//____________________________________________


//--------------------------------------------------
function makeCanvasFullScreen(canvas) {
    var b = document.body;
    var d = document.documentElement;
    var fullw = Math.max(b.clientWidth, b.scrollWidth, d.scrollWidth, d.clientWidth);
    var fullh = Math.max(b.clientHeight, b.scrollHeight, d.scrollHeight, d.clientHeight);
    canvas.width = fullw * 0.97;
    canvas.height = fullh * 0.96;
}

function degrees(radians) {
    return radians * 180.0 / Math.PI;
}
window.onload = function init() {
    document.getElementById('file-input')
        .addEventListener('change', importObj, false);

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

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Create and initialize  buffer objects

    vBuffer = gl.createBuffer();
    texBuffer= gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);

    iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);

    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,fIndex, gl.STATIC_DRAW);


    vNorm = gl.getAttribLocation(program, "normals");
    gl.vertexAttribPointer(vNorm, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNorm);

    // fnBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, fnBuffer);
    // fNorm = gl.getAttribLocation(program, "facenormals");
    texCoord = gl.getAttribLocation(program,"texCoord")
    //gl.vertexAttribPointer(fNorm, 3, gl.FLOAT, false, 0, 0);
    //gl.enableVertexAttribArray(fNorm);
    cBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, flatten(circle.colors), gl.STATIC_DRAW);

    // vColor = gl.getAttribLocation(program, "vColor");
    // gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(vColor);


    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    modelViewMatrix = lookAt(vec3(0, 2, 5), vec3(0, 3, 0), vec3(0, 1, 0));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    projectionMatrix = perspective(60, canvas.width / canvas.height, .01, 500);
    inP = inverse4(projectionMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "projectionMatrix"), false, flatten(projectionMatrix));
    pirate = document.getElementById("obj").text;
    //console.log(pirate);
    parseObj(pirate);
    console.log(models[0]);
        // Create a texture.
        var texture = gl.createTexture();
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
         
        // Asynchronously load an image
        image = new Image();
        image.src="pirate_girl.png";

       
        
    image.onload = function() {
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
           gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
           gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
           gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
           var u_image0Location = gl.getUniformLocation(program, "img0");
           gl.uniform1i(u_image0Location, 0);  // texture unit 0
           gl.activeTexture(gl.TEXTURE0);
           gl.bindTexture(gl.TEXTURE_2D, texture);
        }
        texExist=true;
      };
    render();
}


var t = 1;
var render = function () {
    gl.uniform1f(gl.getUniformLocation(program, "time"), t);


    gl.clear(gl.COLOR_BUFFER_BIT);
    drawModels();
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
var drawModels = function () {
    for (var i = 0; i < models.length; i++) {
        var curr = models[i];
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(curr.vertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(curr.fIndex), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(curr.normals), gl.STATIC_DRAW);
        gl.vertexAttribPointer(vNorm, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNorm);

        if(texExist){
        gl.bindBuffer(gl.ARRAY_BUFFER,texBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(curr.texCoord), gl.STATIC_DRAW);
        gl.vertexAttribPointer(texCoord,2,gl.FLOAT,false,0,0);
        gl.enableVertexAttribArray(texCoord);
    }
        gl.drawElements(gl.TRIANGLES, curr.fIndex.length, gl.UNSIGNED_SHORT, 0);
    }
}
