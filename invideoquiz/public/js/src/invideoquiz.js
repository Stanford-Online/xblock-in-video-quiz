/* Javascript for InVideoQuizXBlock. */
function InVideoQuizXBlock(runtime, element) {
    $('.in-video-quiz-block').closest('.vert').hide();
    var videoId = $('.in-video-quiz-block').data('videoid');
    if (!videoId || !InVideoQuizXBlock.config.hasOwnProperty(videoId)) {
        return;
    }
    var problemTimesMap = InVideoQuizXBlock.config[videoId];
    var studentMode = $('.in-video-quiz-block').data('mode') !== 'staff';
    var extraVideoButton = '<button class="in-video-continue">Continue</button>';
    var video;
    var videoState;

    var knownVideoDimensions;

    // Interval at which to check if video size has changed size
    // and the displayed problems needs to do the same
    var resizeIntervalTime = 100;

    // Interval at which to check for problems to display
    // Checking every 0.5 seconds to make sure we check at least once per actual second of video
    var intervalTime = 500;

    // Timeout to wait before checking for problems again after "play" is clicked
    // Waiting 1.5 seconds to make sure we are moved to the next second and we don't get a double firing
    var intervalTimeout = 1500;

    $(function () {
        $('#seq_content .vert-mod .vert').each(function () {
            var component = $(this);

            if (studentMode) {
                setUpStudentView(component);
            } else {
                showProblemTimesToInstructor(component);
            }
        });

        if (studentMode) {
          knownVideoDimensions = getVideoDimensions();
          bindVideoEvents();
        }
    });

    function setUpStudentView(component) {
        var componentIsVideo = component.data('id').indexOf(videoId) !== -1;
        if (componentIsVideo) {
            video = $('.video', component);
            videoState = video.data('video-player-state');
        } else {
            $.each(problemTimesMap, function (time, componentId) {
                if (component.data('id').indexOf(componentId) !== -1) {
                    component.addClass('in-video-problem-wrapper');
                    $('.xblock-student_view', component).append(extraVideoButton).addClass('in-video-problem').hide();
                }
            });
        }
    }

    function getVideoDimensions() {
        videoPosition = $('.tc-wrapper', video).position().top;
        videoHeight = $('.tc-wrapper', video).css('height');
        videoWidth = $('.tc-wrapper', video).css('width');
        return [videoPosition, videoHeight, videoWidth];
    }

    function videoDimensionsDiffer(newMeasurement, oldMeasurement) {
        if (newMeasurement.length !== oldMeasurement.length) {
            return true;
        }
        for (var i = 0; i < oldMeasurement.length; i++) {
            if (oldMeasurement[i] !== newMeasurement[i]) {
                return true;
            }
        }
        return false;
    }

    function showProblemTimesToInstructor(component) {
        $.each(problemTimesMap, function (time, componentId) {
            var isInVideoComponent = component.data('id').indexOf(componentId) !== -1;
            if (isInVideoComponent) {
                var minutes = parseInt(time / 60, 10);
                var seconds = ('0' + (time % 60)).slice(-2);
                var timeParagraph = '<p class="in-video-alert"><i class="fa fa-exclamation-circle"></i>This component will appear in the video at <strong>' + minutes + ':' + seconds + '</strong></p>';
                component.prepend(timeParagraph);
            }
        });
    }
    
    function resizeInVideoProblem(currentProblem, videoDimensions) {
        currentProblem.css({
            top: videoDimensions[0],
            height: videoDimensions[1],
            width: videoDimensions[2]
        });
    }

    // Bind In Video Quiz display to video time, as well as play and pause buttons
    function bindVideoEvents() {
        var canDisplayProblem = true;
        var intervalObject;
        var resizeIntervalObject;
        var problemToDisplay;

        video.on('play', function () {
          clearInterval(resizeIntervalObject);

          if (problemToDisplay) {
            window.setTimeout(function () {
              canDisplayProblem = true;
            }, intervalTimeout);
            problemToDisplay.hide();
            problemToDisplay = null;
          }

          intervalObject = setInterval(function () {
            var videoTime = parseInt(videoState.videoPlayer.currentTime, 10);
            var problemToDisplayId = problemTimesMap[videoTime];
            if (problemToDisplayId && canDisplayProblem) {
              $('.wrapper-downloads, .video-controls', video).hide();
              $('#seq_content .vert-mod .vert').each(function () {
                var isProblemToDisplay = $(this).data('id').indexOf(problemToDisplayId) !== -1;
                if (isProblemToDisplay) {
                  problemToDisplay = $('.xblock-student_view', this)
                  videoState.videoPlayer.pause();
                  resizeInVideoProblem(problemToDisplay, getVideoDimensions());
                  problemToDisplay.show();
                  problemToDisplay.css({display: 'block'});
                  canDisplayProblem = false;
                }
              });
            }
          }, intervalTime);
        });

        video.on('pause', function () {
          clearInterval(intervalObject);
          if (problemToDisplay) {
            resizeIntervalObject = setInterval(function () {

              // check if the size has changed from the previous state; if so, update
              // both our known size measurements and the size of the problem
              currentVideoDimensions = getVideoDimensions();

              if (videoDimensionsDiffer(currentVideoDimensions, knownVideoDimensions)) {
                    resizeInVideoProblem(problemToDisplay, currentVideoDimensions);
                    knownVideoDimensions = currentVideoDimensions;
              }
            }, resizeIntervalTime);
            $('.in-video-continue', problemToDisplay).on('click', function () {
              $('.wrapper-downloads, .video-controls', video).show();
              videoState.videoPlayer.play();
            });
          }
        });
    }
}
