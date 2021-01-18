In Video Quiz XBlock |BS| |CA|
==============================

This XBlock allows for edX components to be displayed to users inside of videos at specific time points.

Installation
------------

Install the requirements into the python virtual environment of your
``edx-platform`` installation by running the following command from the
root folder:

.. code:: bash

    $ pip install -r requirements.txt

Enabling in Studio
------------------

You can enable the In Video Quiz XBlock in Studio through the
advanced settings.

1. From the main page of a specific course, navigate to
   ``Settings ->    Advanced Settings`` from the top menu.
2. Check for the ``advanced_modules`` policy key, and add
   ``"invideoquiz"`` to the policy value list.
3. Click the "Save changes" button.

Package Requirements
--------------------

setup.py contains a list of package dependencies which are required for this XBlock package.
This list is what is used to resolve dependencies when an upstream project is consuming
this XBlock package. requirements.txt is used to install the same dependencies when running
the tests for this package.

License
-------

The In Video Quiz XBlock is available under the AGPL Version 3.0 License.


.. |BS| image:: https://travis-ci.com/edx/xblock-in-video-quiz.svg?branch=master
  :target: https://travis-ci.com/github/edx/xblock-in-video-quiz

.. |CA| image:: https://coveralls.io/repos/Stanford-Online/xblock-in-video-quiz/badge.svg?branch=master&service=github
  :target: https://coveralls.io/github/Stanford-Online/xblock-in-video-quiz?branch=master
