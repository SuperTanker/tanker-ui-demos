#import <Foundation/Foundation.h>

@import PromiseKit;

NS_ASSUME_NONNULL_BEGIN

@interface ApiClient : NSObject

@property (readonly, nullable) NSString *currentUserId;
@property (readonly, nullable) NSString *currentUserEmail;

- (PMKPromise<NSDictionary *> *)authenticateWithPath:(NSString *)path
                                               email:(NSString *)email
                                            password:(NSString *)password;
- (PMKPromise *)changeEmail:(NSString *)newEmail;
- (PMKPromise *)changePasswordFrom:(NSString *)oldPassword
                                to:(NSString *)newPassword;
- (PMKPromise*)logout;
- (PMKPromise<NSDictionary*>*)getConfig;
- (PMKPromise<NSDictionary*>*)getMe;
- (PMKPromise<NSArray*>*)getUsers;
- (PMKPromise<NSString*>*)getDataFromUser:(NSString*)userId;
- (PMKPromise *)putData:(NSString*)data;
- (PMKPromise *)shareTo:(NSArray<NSString *> *)recipients;

@end

NS_ASSUME_NONNULL_END
