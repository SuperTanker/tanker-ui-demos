//
//  Globals.h
//  tanker-ui-demo
//
//  Created by Loic on 09/04/2018.
//  Copyright © 2018 Tanker. All rights reserved.
//

#ifndef Globals_h
#define Globals_h

@import Tanker;

@interface Globals : NSObject
{
  TKRTanker* tanker;
}

+ (Globals *)sharedInstance;

@property(strong, nonatomic, readwrite) TKRTanker* tanker;

@end

#endif /* Globals_h */
