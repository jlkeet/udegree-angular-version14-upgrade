
declare let gtag:Function;

export class GoogleAnalyticsService {

   public eventEmitter( 
       eventName: string, 
       eventCategory: string, 
       eventAction: string, 
       eventLabel: string = "",  
       eventValue: number = 0 ){ 
            gtag('event', eventName, { 
                    eventCategory: eventCategory, 
                    eventLabel: eventLabel, 
                    eventAction: eventAction, 
                    eventValue: eventValue
                  })
       }
}