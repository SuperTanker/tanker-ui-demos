#import <Foundation/Foundation.h>
#import "ApiClient.h"

@import PromiseKit;
@import Tanker;

NS_ASSUME_NONNULL_BEGIN

@interface Session : NSObject

+ (Session *)sharedSession;

- (PMKPromise<TKRTanker *> *)tankerReady;

- (PMKPromise *)signUpWithEmail:(NSString *)email
                      password:(NSString *)password;
- (PMKPromise *)logInWithEmail:(NSString *)email
                     password:(NSString *)password;
- (PMKPromise *)changeEmail:(NSString *)newEmail;
- (PMKPromise *)changePasswordFrom:(NSString *)oldPassword
                                to:(NSString *)newPassword;
- (PMKPromise *)logout;

- (PMKPromise<NSDictionary *> *)getMe;
- (PMKPromise<NSArray *> *)getUsers;
- (PMKPromise<NSString *> *)getData;
- (PMKPromise<NSString *> *)getDataFromUser:(NSString *)userId;
- (PMKPromise *)putData:(NSString *)data;
- (PMKPromise *)putData:(NSString *)data shareWith:(NSArray<NSString *> *)recipientEmails;

@end

NS_ASSUME_NONNULL_END
