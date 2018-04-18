//
//  LoginViewController.m
//  tanker-ui-demo
//
//  Created by Loic on 09/04/2018.
//  Copyright © 2018 Tanker. All rights reserved.
//

#import "LoginViewController.h"
#import "Globals.h"
#import "DeviceValidationViewController.h"
@import PromiseKit;

@interface LoginViewController ()
@property UIActivityIndicatorView* activityIndicator;
@property (weak, nonatomic) IBOutlet UITextField *usernameField;
@property (weak, nonatomic) IBOutlet UITextField *passwordField;
@property (weak, nonatomic) IBOutlet UILabel *errorLabel;

@end

@implementation LoginViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
  
  _usernameField.returnKeyType = UIReturnKeyNext;
  _usernameField.delegate = self;
  _passwordField.returnKeyType = UIReturnKeyNext;
  _passwordField.delegate = self;
  
  _activityIndicator = [[UIActivityIndicatorView alloc]initWithFrame:CGRectMake(self.view.bounds.size.width / 2 - 25, self.view.bounds.size.height / 2 - 25, 50, 50)];
  [_activityIndicator setActivityIndicatorViewStyle:UIActivityIndicatorViewStyleWhiteLarge];
  [_activityIndicator setColor:[UIColor blueColor]];
  [self.view addSubview:_activityIndicator];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction)triggerLogin:(UIButton *)sender {
  NSString* userId = _usernameField.text;
  NSString* password = _passwordField.text;

  [Globals fetchUserToken:@"login" userId:userId password:password].then(^(NSString *userToken){
    NSError* error = nil;
    [[Globals sharedInstance].tanker connectValidationHandler:^(NSString* validationCode) {
      // Go to the validate device screen
      NSLog(@"In the handler");
      dispatch_async(dispatch_get_main_queue(), ^{
      DeviceValidationViewController *controller = [self.storyboard instantiateViewControllerWithIdentifier:@"DeviceValidation"];
      @try {
        [self.navigationController pushViewController:controller animated:YES];
      } @catch(NSException* e) {
          NSLog(@"--> %@", e);
      }
      });
    } error:&error];
    
    [_activityIndicator startAnimating];
    
    [[Globals sharedInstance].tanker openWithUserID:userId userToken:userToken]
    .then(^{
      [_activityIndicator stopAnimating];
      NSLog(@"Tanker is open");
      DeviceValidationViewController *controller = [self.storyboard instantiateViewControllerWithIdentifier:@"GreatSuccess"];
      [self.navigationController pushViewController:controller animated:YES];
    })
    .catch(^(NSError* error) {
      NSLog(@"Could not open Tanker: %@", [error localizedDescription]);
      return error;
    });
  });
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField
{
  if (textField == self.usernameField) {
    [self.passwordField becomeFirstResponder];
  }
  else if (textField == self.passwordField) {
    [self.passwordField resignFirstResponder];
  }
  return true;
}

@end
