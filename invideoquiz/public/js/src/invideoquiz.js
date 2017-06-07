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

    var knownDimensions;

    // Interval at which to check if video size has changed size
    // and the displayed problems needs to do the same
    var resizeIntervalTime = 100;

    // Interval at which to check for problems to display
    // Checking every 0.5 seconds to make sure we check at least once per actual second of video
    var displayIntervalTime = 500;

    // Timeout to wait before checking for problems again after "play" is clicked
    // Waiting 1.5 seconds to make sure we are moved to the next second and we don't get a double firing
    var displayIntervalTimeout = 1500;

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
          knownDimensions = getDimensions();
          bindVideoEvents();
        }
    });

    function setUpStudentView(component) {
        var componentIsVideo = component.data('id').indexOf(videoId) !== -1;
        if (componentIsVideo) {
            video = $('.video', component);
        } else {
            $.each(problemTimesMap, function (time, componentId) {
                if (component.data('id').indexOf(componentId) !== -1) {
                    component.addClass('in-video-problem-wrapper');
                    $('.xblock-student_view', component).append(extraVideoButton).addClass('in-video-problem').hide();
                }
            });
        }
    }

    function getDimensions() {
        var position = $('.tc-wrapper', video).position().top;
        var height = $('.tc-wrapper', video).css('height');
        var width = $('.tc-wrapper', video).css('width');
        return {
          'top': position,
          'height': height,
          'width': width
        };
    }

    function dimensionsHaveChanged(newDimensions) {
        for (var key in knownDimensions) {
            if (newDimensions.hasOwnProperty(key)) {
                if (knownDimensions[key] !== newDimensions[key]) {
                    return true;
                }
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
    
    function resizeInVideoProblem(currentProblem, dimensions) {
        currentProblem.css(dimensions);
    }

    // Bind In Video Quiz display to video time, as well as play and pause buttons
    function bindVideoEvents() {
        var canDisplayProblem = true;
        var intervalObject;
        var resizeIntervalObject;
        var problemToDisplay;

        video.on('play', function () {
          videoState = videoState || video.data('video-player-state');

          clearInterval(resizeIntervalObject);

          if (problemToDisplay) {
            window.setTimeout(function () {
              canDisplayProblem = true;
            }, displayIntervalTimeout);
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
                  resizeInVideoProblem(problemToDisplay, getDimensions());
                  problemToDisplay.show();
                  problemToDisplay.css({display: 'block'});
                  canDisplayProblem = false;
                }
              });
            }
          }, displayIntervalTime);
        });

        video.on('pause', function () {
          videoState = videoState || video.data('video-player-state');
          clearInterval(intervalObject);
          if (problemToDisplay) {
            resizeIntervalObject = setInterval(function () {
              var currentDimensions = getDimensions();
              if (dimensionsHaveChanged(currentDimensions)) {
                    resizeInVideoProblem(problemToDisplay, currentDimensions);
                    knownDimensions = currentDimensions;
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
