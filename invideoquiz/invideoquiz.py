"""
This XBlock allows for edX components to be displayed to users inside of
videos at specific time points.
"""

import json
import os
import pkg_resources

from xblock.core import XBlock
from xblock.fields import Scope
from xblock.fields import String
from web_fragments.fragment import Fragment
from xblockutils.studio_editable import StudioEditableXBlockMixin
from xblockutils.resources import ResourceLoader

from .utils import _


loader = ResourceLoader(__name__)


def get_resource_string(path):
    """
    Retrieve string contents for the file path
    """
    path = os.path.join('public', path)
    resource_string = pkg_resources.resource_string(__name__, path)
    return resource_string.decode('utf8')


#class InVideoQuizXBlock(StudioEditableXBlockMixin, XBlock):
class InVideoQuizXBlock(XBlock):

    # pylint: disable=too-many-ancestors
    """
    Display CAPA problems within a video component at a specified time.
    """

    display_name = String(
        display_name=_('Display Name'),
        default=_('In-Video Quiz XBlock'),
        scope=Scope.settings,
    )

    video_id = String(
        display_name=_('Video ID'),
        default='',
        scope=Scope.settings,
        help=_(
            'This is the component ID for the video in which '
            'you want to insert your quiz question.'
        ),
    )

    timemap = String(
        display_name=_('Problem Timemap'),
        default='{}',
        scope=Scope.settings,
        help=_(
            'A simple string field to define problem IDs '
            'and their time maps (in seconds) as JSON. '
            'Example: {"60": "50srvqlii4ru9gonprp35gkcfyd5weju"}'
        ),
        multiline_editor=True,
    )

    editable_fields = [
        'video_id',
        'timemap',
    ]

    debug_info = {}
    has_author_view = True  # Tells Studio to use author_view

    def _get_options(self, parent_block, block_type):
        locators = [child for child in parent_block.children if child.block_type == block_type]
        options = [self._get_block_details(block) for block in locators]

        # add the block id if there are duplicate options with the same name
        for option in options:
            count = sum(other_option['display_name'] == option['display_name'] for other_option in options)
            option['label'] = option['display_name']
            if count > 1:
                option['label'] += ' (' + option['block_id'] + ')'

        return options


    def _get_block_details(self, block_locator):
        block = self.runtime.get_block(block_locator)
        block_details = {
            'display_name': block.display_name,
            'block_id': block_locator.block_id,
        }
        return block_details


    def studio_view(self, context):
        """
        Render a form for editing this XBlock
        """
        fragment = Fragment()

        parent_block = self.runtime.get_block(self.parent)
        video_options = self._get_options(parent_block, 'video')

        problem_options = self._get_options(parent_block, 'problem')

        # convert map of times to blocks, to one of blocks to times
        blocktimemap = {}
        saved_timemap = {}
        if self.timemap:
            saved_timemap = json.loads(self.timemap)
        if isinstance(saved_timemap, dict):
            for time, block_id in saved_timemap.iteritems():
                blocktimemap[block_id] = time
        # self.debug_info['self.timemap'] = self.timemap
        # self.debug_info['self.video_id'] = self.video_id

        processed_timemap = []
        for problem in problem_options:
            processed_timemap.append({
                'time': blocktimemap.get(problem['block_id'], ''),
                'block_id': problem['block_id'],
                'label': problem['label'],
            })

        context = {
            'video_id': self.video_id,
            'video_options': video_options,
            'timemap': processed_timemap,
            'debug_info': self.debug_info,
            'has_videos': len(video_options) > 0,
            'has_problem_components': len(processed_timemap) > 0,
        }

        fragment.content = loader.render_template('templates/studio_invideo_edit.html', context)
        fragment.add_javascript(loader.load_unicode('public/studio_edit.js'))
        fragment.initialize_js('StudioEditableXBlockMixin')
        return fragment


    def author_view(self, context=None):
        """
        Render a form for editing this XBlock
        """
        fragment = Fragment()

        parent_block = self.runtime.get_block(self.parent)
        video_options = self._get_options(parent_block, 'video')


        problem_options = self._get_options(parent_block, 'problem')

        # convert map of times to blocks, to one of blocks to times
        blocktimemap = {}
        saved_timemap = {}
        if self.timemap:
            saved_timemap = json.loads(self.timemap)
        if isinstance(saved_timemap, dict):
            for time, block_id in saved_timemap.iteritems():
                blocktimemap[block_id] = time

        processed_timemap = []
        for problem in problem_options:
            if blocktimemap.get(problem['block_id']):
                processed_timemap.append({
                    'time': blocktimemap.get(problem['block_id'], ''),
                    'block_id': problem['block_id'],
                    'label': problem['label'],
                })

        self.debug_info['video_options'] = video_options
        self.debug_info['self.video_id'] = self.video_id
        self.debug_info['has_videos'] = bool(self.video_id) and len(video_options) > 0

        context = {
            'video_id': self.video_id,
            'video_options': video_options,
            'timemap': processed_timemap,
            'debug_info': self.debug_info,
            'has_videos': bool(self.video_id) and len(video_options) > 0,
            'has_problem_components': len(processed_timemap) > 0,
        }

        fragment.content = loader.render_template('templates/studio_invideo_author.html', context)
        return fragment


    @XBlock.json_handler
    def submit_studio_edits(self, data, suffix=''):
        """
        AJAX handler for studio_view() Save button
        """
        if data['video_id']:
            self.video_id = data['video_id']

        timemap = {}
        for mapping in data['timemap']:
            if mapping['block_id'] and mapping['time'] and mapping['time'].isdigit():
                timemap[mapping['time']] = mapping['block_id']
        self.timemap = json.dumps(timemap)

        # used for debugging
        self.debug_info.clear()
        # self.debug_info['data'] = data
        # self.debug_info['video_id'] = self.video_id
        # self.debug_info['timemap'] = self.timemap


        ############################################################################
        # {'data': {u'video': u'78c68fc0ecbd44b5a1ae39628107dce3', u'timemap': [
        #     {u'problem': u'1bc2cdb12fe44b219332756bece8734e', u'time': u'3'},
        #     {u'problem': u'blank', u'time': u'4'},
        #     {u'problem': u'a93c133199ea4c7d969d9d05d23bfc05', u'time': u'6'},
        #     {u'problem': u'blank', u'time': u''},
        #     {u'problem': u'blank', u'time': u''},
        #     {u'problem': u'1bc2cdb12fe44b219332756bece8734e', u'time': u''},
        #     {u'problem': u'blank', u'time': u''}]}}

        # values = {}  # dict of new field values we are updating
        # to_reset = []  # list of field names to delete from this XBlock
        # for field_name in self.editable_fields:
        #     field = self.fields[field_name]
        #     if field_name in data['values']:
        #         if isinstance(field, JSONField):
        #             values[field_name] = field.from_json(data['values'][field_name])
        #         else:
        #             raise JsonHandlerError(400, "Unsupported field type: {}".format(field_name))
        #     elif field_name in data['defaults'] and field.is_set_on(self):
        #         to_reset.append(field_name)
        # self.clean_studio_edits(values)
        # validation = Validation(self.scope_ids.usage_id)
        # # We cannot set the fields on self yet, because even if validation fails, studio is going to save any changes we
        # # make. So we create a "fake" object that has all the field values we are about to set.
        # preview_data = FutureFields(
        #     new_fields_dict=values,
        #     newly_removed_fields=to_reset,
        #     fallback_obj=self
        # )
        # self.validate_field_data(validation, preview_data)
        # if validation:
        #     for field_name, value in values.iteritems():
        #         setattr(self, field_name, value)
        #     for field_name in to_reset:
        #         self.fields[field_name].delete_from(self)
        #     return {'result': 'success'}
        # else:
        #     raise JsonHandlerError(400, validation.to_json())


    # Decorate the view in order to support multiple devices e.g. mobile
    # See: https://openedx.atlassian.net/wiki/display/MA/Course+Blocks+API
    # section 'View @supports(multi_device) decorator'
    @XBlock.supports('multi_device')
    def student_view(self, context=None):  # pylint: disable=unused-argument
        """
        Show to students when viewing courses
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
                'user_mode': self.user_mode,
            },
        )
        config = get_resource_string('js/src/config.js')
        config = config.format(
            video_id=self.video_id,
            timemap=self.timemap,
        )
        fragment.add_javascript(config)
        return fragment

    @property
    def user_mode(self):
        """
        Check user's permission mode for this XBlock.
        Returns:
            user permission mode
        """
        try:
            if self.xmodule_runtime.user_is_staff:
                return 'staff'
        except AttributeError:
            pass
        return 'student'

    @staticmethod
    def workbench_scenarios():
        """
        A canned scenario for display in the workbench.
        """
        return [
            ("InVideoQuizXBlock",
             """<invideoquiz video_id='###' timemap='{ 10: "###" }' />
             """),
            ("Multiple InVideoQuizXBlock",
             """<vertical_demo>
                <invideoquiz video_id='###' timemap='{ 10: "###" }' />
                <invideoquiz video_id='###' timemap='{ 10: "###" }' />
                <invideoquiz video_id='###' timemap='{ 10: "###" }' />
                </vertical_demo>
             """),
        ]

    def get_resource_url(self, path):
        """
        Retrieve a public URL for the file path
        """
        path = os.path.join('public', path)
        resource_url = self.runtime.local_resource_url(self, path)
        return resource_url

    def build_fragment(
            self,
            path_html='',
            paths_css=None,
            paths_js=None,
            urls_css=None,
            urls_js=None,
            fragment_js=None,
            context=None,
    ):  # pylint: disable=too-many-arguments
        """
        Assemble the HTML, JS, and CSS for an XBlock fragment
        """
        paths_css = paths_css or []
        paths_js = paths_js or []
        urls_css = urls_css or []
        urls_js = urls_js or []
        # If no context is provided, convert self.fields into a dict
        context = context or {
            key: getattr(self, key)
            for key in self.editable_fields
        }
        html_source = get_resource_string(path_html)
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
