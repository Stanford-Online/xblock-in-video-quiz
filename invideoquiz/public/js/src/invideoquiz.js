/* Javascript for InVideoQuizXBlock. */
function InVideoQuizXBlock(runtime, element) {
    $(function ($) {
        var videoId = $('.in-video-quiz-block').data('videoid');
        var problemTimesMap = InVideoQuizXBlock.config[videoId] || {};
        var extraVideoButton = '<button class="in-video-continue">Continue</button>';
        var video;

        $('.in-video-quiz-block').closest('.vert').hide();

        if (!videoId || !problemTimesMap) {
            return;
        }

        var isUserStudent = $('.wrap-instructor-info').length === 0;
 
        $("#seq_content .vert-mod .vert").each(function() {
            var component = $(this);

            if (isUserStudent) {
                // setUpStudentView();
                if (component.data('id').indexOf(videoId) !== -1) {
                    video = $('.video', component);
                } else {
                    $.each(problemTimesMap, function(key, value) {
                        if (component.data('id').indexOf(value) !== -1) {
                            component.addClass('in-video-problem-wrapper');
                            $('.xblock-student_view', component).append(extraVideoButton).addClass('in-video-problem').hide();
                        }
                    });
                }
            } else {
                // showProblemTimesToInstructor();
                $.each(problemTimesMap, function(time, componentId) {
                    if (component.data('id').indexOf(componentId) !== -1) {
                        var minutes = parseInt(time / 60);
                        var seconds = ("0" + (time % 60)).slice(-2);
                        var timeParagraph = "<p class='in-video-alert'><i class='fa fa-exclamation-circle'></i> This component will appear in the video at <strong>" + minutes + ":" + seconds + "</strong></p>";
                        component.prepend(timeParagraph);
                    }
                });
            }
        });

        if (isUserStudent) {
          // bindVideoEvents();

          var state;
          var videoTime;
          var intervalTime = 500;
          var canDisplayProblem = true;
          var intervalObject;
          var problemToDisplay;

          video.on('play', function () {
            if (problemToDisplay) {
              window.setTimeout(function() {
                canDisplayProblem = true;
              }, 1250);
              problemToDisplay.hide();
              problemToDisplay = null;
            }

            state = video.data('video-player-state')

            intervalObject = setInterval(function() {
              videoTime = parseInt(state.videoPlayer.currentTime);
              var problemToDisplayId = problemTimesMap[videoTime];
              if (problemToDisplayId && canDisplayProblem) {
                $("#seq_content .vert-mod .vert").each(function() {
                  if ($(this).data('id').indexOf(problemToDisplayId) !== -1) {
                    problemToDisplay = $('.xblock-student_view', this)
                    state.videoPlayer.pause();
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
              $('.in-video-continue', problemToDisplay).on('click', function() {
                state.videoPlayer.play();
              });
            }
          });
        }
    });
}
