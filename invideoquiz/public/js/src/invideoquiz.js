/* Javascript for InVideoQuizXBlock. */
function InVideoQuizXBlock(runtime, element) {
    var videoId = $('.in-video-quiz-block').data('videoid');
    var studentMode = $('.in-video-quiz-block').data('mode') !== 'staff';
    var problemTimesMap = InVideoQuizXBlock.config[videoId] || {};
    var extraVideoButton = '<button class="in-video-continue">Continue</button>';
    var video;
    var videoState;

    // Interval at which to check for problems to display
    // Checking every 0.5 seconds to make sure we check at least once per actual second of video
    var intervalTime = 500;

    // Timeout to wait before checking for problems again after "play" is clicked
    // Waiting 1.5 seconds to make sure we are moved to the next second and we don't get a double firing
    var intervalTimeout = 1500;

    $(function () {
        $('.in-video-quiz-block').closest('.vert').hide();

        if (!videoId || !problemTimesMap) {
            return;
        }

        $('#seq_content .vert-mod .vert').each(function () {
            var component = $(this);

            if (studentMode) {
                setUpStudentView(component);
            } else {
                showProblemTimesToInstructor(component);
            }
        });

        if (studentMode) {
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

    // Bind In Video Quiz display to video time, as well as play and pause buttons
    function bindVideoEvents() {
        var canDisplayProblem = true;
        var intervalObject;
        var problemToDisplay;

        video.on('play', function () {
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
                  problemToDisplay.show();
                  canDisplayProblem = false;
                }
              });
            }
          }, intervalTime);
        });

        video.on('pause', function () {
          clearInterval(intervalObject);
          if (problemToDisplay) {
            $('.in-video-continue', problemToDisplay).on('click', function () {
              $('.wrapper-downloads, .video-controls', video).show();
              videoState.videoPlayer.play();
            });
          }
        });
    }
}
