"""TO-DO: Write a description of what this XBlock is."""

import os
import pkg_resources

from django.utils.translation import ugettext as _

from xblock.core import XBlock
from xblock.fields import Scope
from xblock.fields import String
from xblock.fragment import Fragment

from xblockutils.studio_editable import StudioEditableXBlockMixin


class InVideoQuizXBlock(StudioEditableXBlockMixin, XBlock):
    """
    TO-DO: document what your XBlock does.
    """

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.

    display_name = String(
        display_name=_('Display Name:'),
        default=_('In-Video Quiz XBlock'),
        scope=Scope.settings,
    )

    video_id = String(
        display_name=_('Video ID'),
        default=_(''),
        scope=Scope.settings,
        help=_('This is the in video quiz video ID'),
    )

    timemap = String(
        display_name=_('Problem Timemap'),
        default=_(''),
        scope=Scope.settings,
        help=_(
            'A simple string field to define problem IDs and their time maps (in seconds) as JSON. '
            'Example: { "10": "component_id_of_element"}'
        ),
        multiline_editor=True,
    )

    editable_fields = [
        'video_id',
        'timemap',
    ]

    # TO-DO: change this view to display your data your own way.
    def student_view(self, context=None):
        """
        The primary view of the InVideoQuizXBlock, shown to students
        when viewing courses.
        """
        fragment = self.build_fragment(
            path_html='html/invideoquiz.html',
            paths_css=[
                'css/invideoquiz.css',
            ],
            paths_js=[
                'js/src/invideoquiz.js',
            ],
            fragment_js='InVideoQuizXBlock',
            context={
                'video_id': self.video_id,
            },
        )

        config = self.get_resource_string("js/src/config.js")
        config = config.format(
            video_id=self.video_id,
            timemap=self.timemap,
        )
        fragment.add_javascript(config)

        if not self.video_id:
            pass #logger.warn('Rendering InVideoQuiz xBlock without a video ID')

        return fragment

    # TO-DO: change this handler to perform your own actions.  You may need
    # more than one handler, or you may not need any handlers at all.
    @XBlock.json_handler
    def increment_count(self, data, suffix=''):
        """
        An example handler, which increments the data.
        """
        # Just to show data coming in...
        assert data['hello'] == 'world'

        self.count += 1
        return {"count": self.count}

    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("InVideoQuizXBlock",
             """<invideoquiz/>
             """),
            ("Multiple InVideoQuizXBlock",
             """<vertical_demo>
                <invideoquiz/>
                <invideoquiz/>
                <invideoquiz/>
                </vertical_demo>
             """),
        ]

    def get_resource_string(self, path):
        """
        Retrieve string contents for the file path
        """
        path = os.path.join('public', path)
        resource_string = pkg_resources.resource_string(__name__, path)
        return resource_string.decode('utf8')

    def get_resource_url(self, path):
        """
        Retrieve a public URL for the file path
        """
        path = os.path.join('public', path)
        resource_url = self.runtime.local_resource_url(self, path)
        return resource_url

    def build_fragment(self,
        path_html='',
        paths_css=[],
        paths_js=[],
        urls_css=[],
        urls_js=[],
        fragment_js=None,
        context=None,
    ):
        """
        Assemble the HTML, JS, and CSS for an XBlock fragment
        """
        # If no context is provided, convert self.fields into a dict
        context = context or {
            key: getattr(self, key)
                for key in self.fields
                    if key not in DEFAULT_FIELDS
        }
        html_source = self.get_resource_string(path_html)
        html_source = html_source.format(
            **context
        )
        fragment = Fragment(html_source)
        for path in paths_css:
            url = self.get_resource_url(path)
            fragment.add_css_url(url)
        for path in paths_js:
            url = self.get_resource_url(path)
            fragment.add_javascript_url(url)
        for url in urls_css:
            fragment.add_css_url(url)
        for url in urls_js:
            fragment.add_javascript_url(url)
        if fragment_js:
            fragment.initialize_js(fragment_js)
        return fragment
