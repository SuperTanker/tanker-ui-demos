import React from 'react';

import {
  Alert,
  Button,
  ControlLabel,
  FormGroup,
  FormControl,
  HelpBlock,
} from 'react-bootstrap';

class PasswordResetConfirm extends React.Component {
  state = {
    passwordResetToken: null,
    newPassword: '',
    newPasswordConfirmation: '',
    errorMessage: null,
    successMessage: null,
    formDisabled: false,
  }

  componentDidMount = async () => {
    // Extract app reset token from URL hash
    const passwordResetToken = window.location.hash.substr(1);
    this.setState({ passwordResetToken });
  };

  onSubmit = async (event) => {
    event.preventDefault();

    const { newPassword, passwordResetToken } = this.state;
    this.setState({ formDisabled: true });

    try {
      await this.props.onSubmit({
        newPassword,
        passwordResetToken,
      });
    } catch (e) {
      this.setState({ errorMessage: e.message, formDisabled: false });
    }
  };

  onPasswordChange = (passwordChanges) => {
    this.setState({ ...passwordChanges });
  };

  navigationHandler = (path) => {
    const { history } = this.props;

    return (event) => {
      event.preventDefault();
      history.replace(path);
    };
  };

  validatePassword = () => {
    const { newPassword, newPasswordConfirmation } = this.state;
    return newPassword === newPasswordConfirmation;
  };

  render() {
    const {
      newPassword, newPasswordConfirmation,
      errorMessage, formDisabled, successMessage,
    } = this.state;
    const passwordEmpty = !newPassword || !newPasswordConfirmation;
    const passwordValid = this.validatePassword();

    return (
      <form>
        {errorMessage && <Alert bsStyle="danger">{errorMessage}</Alert>}
        {successMessage && <Alert bsStyle="success">{successMessage} Please <a href="/login">log in again</a>.</Alert>}
        {!errorMessage && !successMessage && (
          <Alert bsStyle="warning">Please fill in your new password to recover your account.</Alert>
        )}
        <ControlLabel>New password</ControlLabel>
        <FormGroup validationState={passwordValid ? null : 'error'}>
          <FormControl
            type="password"
            value={newPassword}
            placeholder="Enter your new password"
            onChange={(event) => this.onPasswordChange({ newPassword: event.target.value })}
            disabled={formDisabled}
            required
            autoFocus
          />
        </FormGroup>
        <FormGroup validationState={passwordValid ? null : 'error'}>
          <FormControl
            type="password"
            value={newPasswordConfirmation}
            placeholder="Confirm your new password"
            onChange={(event) => this.onPasswordChange({ newPasswordConfirmation: event.target.value })}
            disabled={formDisabled}
            required
          />
          <FormControl.Feedback />
          {!passwordValid && <HelpBlock>The new password and its confirmation do not match</HelpBlock>}
        </FormGroup>
        <Button
          id="save-password-button"
          type="submit"
          bsStyle="primary"
          onClick={this.onSubmit}
          disabled={formDisabled || passwordEmpty || !passwordValid}
        >
          Save
        </Button>
      </form>
    );
  }
}

export default PasswordResetConfirm;
