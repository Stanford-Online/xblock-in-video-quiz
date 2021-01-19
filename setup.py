"""Setup for invideoquiz XBlock."""

import os
from setuptools import setup
from setuptools.command.test import test as TestCommand


def package_data(pkg, roots):
    """Generic function to find package_data.

    All of the files under each of the `roots` will be declared as package
    data for package `pkg`.

    """
    data = []
    for root in roots:
        for dirname, _, files in os.walk(os.path.join(pkg, root)):
            for fname in files:
                data.append(os.path.relpath(os.path.join(dirname, fname), pkg))

    return {pkg: data}


def load_requirements(*requirements_paths):
    """
    Load all requirements from the specified requirements files.
    Returns a list of requirement strings.
    """
    requirements = set()
    for path in requirements_paths:
        with open(path) as reqs:
            requirements.update(
                line.split('#')[0].strip() for line in reqs
                if is_requirement(line.strip())
            )
    return list(requirements)


def is_requirement(line):
    """
    Return True if the requirement line is a package requirement;
    that is, it is not blank, a comment, a URL, or an included file.
    """
    return line and not line.startswith(('-r', '#', '-e', 'git+', '-c'))


class Tox(TestCommand):
    user_options = [('tox-args=', 'a', 'Arguments to pass to tox')]

    def initialize_options(self):
        TestCommand.initialize_options(self)
        self.tox_args = None

    def finalize_options(self):
        TestCommand.finalize_options(self)
        self.test_args = []
        self.test_suite = True

    def run_tests(self):
        # import here, cause outside the eggs aren't loaded
        import tox
        import shlex
        args = self.tox_args
        if args:
            args = shlex.split(self.tox_args)
        errno = tox.cmdline(args=args)
        sys.exit(errno)

setup(
    name='invideoquiz-xblock',
    version='1.0.0',
    description='Helper XBlock to locate CAPA problems within videos.',
    license='AGPL v3',
    packages=[
        'invideoquiz',
    ],
    install_requires=load_requirements('requirements/base.in'),
    dependency_links=[
        'https://github.com/edx/xblock-utils/tarball/c39bf653e4f27fb3798662ef64cde99f57603f79#egg=xblock-utils',
    ],
    entry_points={
        'xblock.v1': [
            'invideoquiz = invideoquiz:InVideoQuizXBlock',
        ],
    },
    package_data=package_data('invideoquiz', ['static', 'public']),
    classifiers=[
        'Development Status :: 5 - Production/Stable',
        'Framework :: Django',
        'Framework :: Django :: 2.2',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: Apache Software License',
        'Natural Language :: English',
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
    ],
)
