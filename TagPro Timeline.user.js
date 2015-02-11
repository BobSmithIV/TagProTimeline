// ==UserScript==
// @name          TagPro Timeline
// @namespace     http://www.reddit.com/user/Bob_Smith_IV
// @version       1.0
// @description   Displays and saves a timeline of hold at the end of the game
// @include       http://tagpro-*.koalabeast.com*
// @include       http://tangent.jukejuice.com*
// @include          http://maptest.newcompte.fr:*
// @author        BobSmithIV
// @copyright     2014+, BobSmithIV
// ==/UserScript==

tagpro.ready(function() {
    
    //initialize variables
    var currState=0,
        timelineRectangleData=[],
        flagState=0; //0 for both flags in base, 1 for red holding, 2 for blue holding, 3 for both holding

    
    //timeline variables
    var red='#fb0000',
        blue='#003fba',
        noGrabGrey='#909090',
        jointPurple='#800080',
        redTimelineTop=0,
        blueTimelineTop=20,
        mainTimelineTop=44;
    
    function updateTimeline(){     //checks every 20ms
        if(currState==1){
            var oldFlagState = flagState;
            flagState=0;
            if (tagpro.ui.blueFlagTaken || tagpro.ui.yellowFlagTakenByRed){
                flagState+=1;
            }
            if (tagpro.ui.redFlagTaken || tagpro.ui.yellowFlagTakenByBlue){
                flagState+=2;
            }
            if (oldFlagState>1 && flagState<2){    //if a red player has just dropped or capped the fla
                timelineRectangleData.push([flagState,new Date()-new Date(0)]);
            }
            if (oldFlagState%2==1&&flagState%2==0){    //if a blue player has just dropped or capped the flag
                timelineRectangleData.push([flagState,new Date()-new Date(0)]);
            }
            if (oldFlagState<2&&flagState>1){    //if a red player has just grabbed the flag
                timelineRectangleData.push([flagState,new Date()-new Date(0)]);
            }
            if (oldFlagState%2==0&&flagState%2==1){  //if a blue player has just grabbed the flag
                timelineRectangleData.push([flagState,new Date()-new Date(0)]);
            }
        }
    }
    
    var updaterTimer = setInterval(updateTimeline, 20);
    
    function startTimeline(){
        if(currState==1&&tagpro.ui){
            clearTimeout(starter);
            flagState=0;
            if (tagpro.ui.blueFlagTaken || tagpro.ui.yellowFlagTakenByRed){
                flagState+=1;
            }
            if (tagpro.ui.redFlagTaken || tagpro.ui.yellowFlagTakenByBlue){
                flagState+=2;
            }
            timelineRectangleData.push([flagState,new Date()-new Date(0)]);
        }
    }
    
    var starter = setInterval(startTimeline, 5);
    
    tagpro.socket.on('end', function(data) { //once the game ends
        clearTimeout(updaterTimer);
        updateTimeline();
        
        if (flagState!=0){
            timelineRectangleData.push([0,new Date()-new Date(0)]);
        }
        drawTimelineRectangle();
    });
    
    tagpro.socket.on('time', function(data) { //only occurs when you first join a game, and when the game actually starts
        currState = data.state; //3 for game hasn't started, 1 for in play (and 2 is maybe for no game happening on current port?)
    });
    
    
    function drawTimelineRectangle(){
        var data = timelineRectangleData;
        var timeline = document.createElement('div');
        timeline.id = 'timeline';
        timeline.style.width = '1001px';
        timeline.style.height = '60px';
        timeline.style.top = '3px';
        timeline.style.marginLeft = '50%';
        timeline.style.left = '-500px';
        timeline.style.position = 'absolute';
        timeline.style.backgroundColor = '#202020';
        document.body.appendChild(timeline);
        
        for (var i = 0; i<3; i++){
            back = document.createElement('div');
            back.id = 'back'+i;
            back.style.width = '1001px';
               back.style.height = '16px';
            back.style.position = 'absolute';
            back.style.backgroundColor = noGrabGrey;
            back.style.top = mainTimelineTop+'px';
            document.getElementById('timeline').appendChild(back);
        }
        
        document.getElementById('back1').style.top = blueTimelineTop+'px';
        document.getElementById('back2').style.top = redTimelineTop+'px';
        
        var end = data[data.length-1][1],
            start = data[0][1],
            scale = 1000/(end-start);
        
        var colour='',
            chunk,
            redChunk,
            blueChunk,
            greyChunk,
            length,
            startPoint,
            offset=0;
        for (var i = 0; i<data.length; i++){
            startPoint= (data[i][1]-start)*scale+offset;
            if (i==data.length-1){ 
                length=0;
            }else{ 
                length = (data[i+1][1]-data[i][1])*scale;
            }
            if (length<1&&i!=data.length-1){
                length=1;
                offset++;
            }else{
                offset=0;
            }
            startPoint = Math.round(startPoint);
            length = Math.round(length);
            if (data[i][0]==0){
                colour=noGrabGrey; //no grab colour
                createGreyChunk(length,startPoint,blueTimelineTop);
                createGreyChunk(length,startPoint,redTimelineTop);
            }else if (data[i][0]==1){
                colour=red;
                createRedChunk(length,startPoint);
                createGreyChunk(length,startPoint,blueTimelineTop);
            }else if (data[i][0]==2){
                colour=blue; //blue grab colour
                createBlueChunk(length,startPoint);
                createGreyChunk(length,startPoint,redTimelineTop);

            }else if (data[i][0]==3){
                colour=jointPurple; //both grab colour
                createRedChunk(length,startPoint);
                createBlueChunk(length,startPoint);
            }
            chunk = document.createElement('div');
            chunk.id = 'chunk'+i;
            chunk.style.width = length+'px';
            chunk.style.height = '16px';
            chunk.style.left = startPoint+'px';
            chunk.style.top = mainTimelineTop+'px';
            chunk.style.position = 'absolute';
            chunk.style.backgroundColor = colour;
            document.getElementById('timeline').appendChild(chunk);
        }
        
        
        var downloadBtn = document.createElement('div');
        downloadBtn.id = 'downloadBtn';
        downloadBtn.style.width = '160px';
        downloadBtn.style.height = '23px';
        downloadBtn.style.top = '63px';
        downloadBtn.style.paddingTop = '5px';
        downloadBtn.style.marginLeft = '50%';
        downloadBtn.style.left = '-80px';
        downloadBtn.style.position = 'absolute';
        downloadBtn.style.backgroundColor = '#000000';
        downloadBtn.style.textAlign = '-webkit-center';
        downloadBtn.style.fontSize = '14px';
        downloadBtn.style.cursor = 'pointer';
        downloadBtn.style.color = '#00FF00';
        downloadBtn.style.webkitUserSelect= 'none';
        downloadBtn.innerText = 'Download as .png';
        document.body.appendChild(downloadBtn);
        downloadBtn.onclick = exportTimelineRectangle;
    }
    
    
    function createRedChunk(elementLength,elementStart){
        var redChunk = document.createElement('div');
        redChunk.id = 'redChunk';
        redChunk.style.width = elementLength+'px';
        redChunk.style.height = '16px';
        redChunk.style.left = elementStart+'px';
        redChunk.style.top = redTimelineTop+'px';
        redChunk.style.position = 'absolute';
        redChunk.style.backgroundColor = red;
        document.getElementById('timeline').appendChild(redChunk);
    }
    function createBlueChunk(elementLength,elementStart){
        var blueChunk = document.createElement('div');
        blueChunk.id = 'blueChunk';
        blueChunk.style.width = elementLength+'px';
        blueChunk.style.height = '16px';
        blueChunk.style.left = elementStart+'px';
        blueChunk.style.top = blueTimelineTop+'px';
        blueChunk.style.position = 'absolute';
        blueChunk.style.backgroundColor = blue;
        document.getElementById('timeline').appendChild(blueChunk);
    }
    function createGreyChunk(elementLength,elementStart, elementTop){
        var greyChunk = document.createElement('div');
        greyChunk.id = 'greyChunk';
        greyChunk.style.width = elementLength+'px';
        greyChunk.style.height = '16px';
        greyChunk.style.left = elementStart+'px';
        greyChunk.style.top = elementTop+'px';
        greyChunk.style.position = 'absolute';
        greyChunk.style.backgroundColor = noGrabGrey;
        document.getElementById('timeline').appendChild(greyChunk);
    }
    
    function exportTimelineRectangle(){
        var data = timelineRectangleData;
        var timeline = document.createElement('canvas');
        timeline.id = 'timelineCanvas';
        timeline.width = '1001';
        timeline.height = '60';
        timeline.style.bottom = '16px';
        timeline.style.marginLeft = '50%';
        timeline.style.left = '-50000px';
        timeline.style.position = 'absolute';
        timeline.style.backgroundColor = '#202020';
        document.body.appendChild(timeline);

        var end = data[data.length-1][1],
            start = data[0][1],
            scale = 1000/(end-start),
            colour='',
            length=0,
            startPoint=0,
            offset=0;
        
        timeline= document.getElementById("timelineCanvas");
        timeline = timeline.getContext("2d");
        timeline.fillStyle=noGrabGrey;
        timeline.fillRect(0,redTimelineTop,1000,16);
        timeline.fillRect(0,blueTimelineTop,1000,16);
        timeline.fillRect(0,mainTimelineTop,1000,16);
        
        for (var i = 0; i<data.length; i++){
            startPoint=(data[i][1]-start)*scale+offset ;
            if (i==data.length-1){ 
                length=0;
            }else{ 
                length = (data[i+1][1]-data[i][1])*scale;
            }
            if (length<1&&i!=data.length-1){
                length=1;
                offset++;
            }else{
                offset=0;
            }
            startPoint = Math.round(startPoint);
            length = Math.round(length);
            if (data[i][0]==0){
                colour=noGrabGrey; //no grab colour
                timeline.fillStyle=colour;
                timeline.fillRect(startPoint,redTimelineTop,length,16);
                timeline.fillRect(startPoint,blueTimelineTop,length,16);
            }else if (data[i][0]==1){
                colour=red; //red grab colour
                timeline.fillStyle=colour;
                timeline.fillRect(startPoint,redTimelineTop,length,16);
                timeline.fillStyle=noGrabGrey;
                timeline.fillRect(startPoint,blueTimelineTop,length,16);
            }else if (data[i][0]==2){
                colour=blue; //blue grab colour
                timeline.fillStyle=colour;
                timeline.fillRect(startPoint,blueTimelineTop,length,16);
                timeline.fillStyle=noGrabGrey;
                timeline.fillRect(startPoint,redTimelineTop,length,16);
            }else if (data[i][0]==3){
                colour=jointPurple; //both grab colour
                timeline.fillStyle=red;
                timeline.fillRect(startPoint,redTimelineTop,length,16);
                timeline.fillStyle=blue;
                timeline.fillRect(startPoint,blueTimelineTop,length,16);
            }
            timeline.fillStyle = colour;
            timeline.fillRect(startPoint,mainTimelineTop,length,16);
        }
        var pngFile = document.getElementById('timelineCanvas');
        pngFile = pngFile.toDataURL("image/png");
        var download = document.createElement('a');
        download.href = 'data:image/png;"'+pngFile;
        download.download = 'holdTimeline.png';
        download.click();
    }

    
});    

