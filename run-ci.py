import json
import os
import time

import path

import ci
import ci.dmenv
import ci.quickstart


def get_src_path():
    this_path = path.Path(__file__).abspath()
    return this_path.parent


def ensure_default_browser_not_started(app):
    """"
    When we call `yarn start:web:{app}`
    react-scripts will automatically open the default browser.

    In order to prevent this from happening,
    we create a file named `.env` in client/web/{app}
    containing BROWSER=NONE

    """
    src_path = get_src_path()
    dot_env_path = src_path / f"client/web/{app}/.env"
    dot_env_path.write_text("BROWSER=NONE\n")


def run_mypy():
    src_path = get_src_path()
    tests_path = src_path / "tests"
    env = os.environ.copy()
    env["MYPYPATH"] = tests_path / "stubs"
    ci.dmenv.run(
        "mypy",
        "--strict",
        "--ignore-missing-imports",
        tests_path,
        check=True,
        env=env,
    )


def run_end_to_end_tests(app):
    ensure_default_browser_not_started(app)
    config_path = path.Path("config.json")
    config_path.write_text(json.dumps(ci.quickstart.config))
    src_path = get_src_path()
    tests_path = src_path / "tests"
    with ci.run_in_background("yarn", "start", "--config", config_path, cwd=src_path):
        with ci.run_in_background("yarn", "start:web:%s" % app, cwd=src_path):
            # We let the server and the app time to fully start,
            # otherwise, browser might be stuck in a no man's land
            time.sleep(1)
            if app == "tutorial":
                pytest_file = "test_notepad.py"
            else:
                snake_case_name = app.replace("-", "_")
                pytest_file = f"test_{snake_case_name}.py"
            env = os.environ.copy()
            # On Ubuntu chromedriver is in /usr/lib/chromium-browser because reasons,
            # so add that to PATH.
            # This is required for Selenium to work.
            env["PATH"] = "/usr/lib/chromium-browser:" + env["PATH"]
            ci.dmenv.run(
                "pytest",
                "--verbose",
                "--capture=no",
                "--headless",
                tests_path / pytest_file,
                check=True,
                env=env,
            )


def run_linters():
    src_path = get_src_path()
    ci.run("yarn")
    ci.run("yarn", "lint", cwd=src_path / "server")
    ci.run("yarn", "lint", cwd=src_path / "client/web/notepad")


def run_server_tests():
    src_path = get_src_path()
    ci.run("yarn", "test", check=True, cwd=src_path / "server")


def main():
    run_mypy()
    run_linters()
    run_server_tests()
    for app in ["api-observer", "notepad", "tutorial"]:
        run_end_to_end_tests(app)


if __name__ == "__main__":
    main()