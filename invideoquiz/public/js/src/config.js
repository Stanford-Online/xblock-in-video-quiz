/* Configuration for InVideoQuizzes */
var InVideoQuizXBlock = InVideoQuizXBlock || {{}};

InVideoQuizXBlock.config = InVideoQuizXBlock.config || {{}};

var videoId = '{video_id}';
var timemap = `{timemap}`;
if (videoId) {{
    InVideoQuizXBlock.config[videoId] = JSON.parse(timemap);
}}
