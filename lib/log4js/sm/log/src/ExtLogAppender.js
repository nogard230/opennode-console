/*
 * Copyright © 2012 Pedro Agullo Soliveres.
 * 
 * This file is part of Log4js-ext.
 *
 * Log4js-ext is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License.
 *
 * Commercial use is permitted to the extent that the code/component(s)
 * do NOT become part of another Open Source or Commercially developed
 * licensed development library or toolkit without explicit permission.
 *
 * Log4js-ext is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Log4js-ext.  If not, see <http://www.gnu.org/licenses/>.
 * 
 * This software uses the ExtJs library (http://extjs.com), which is 
 * distributed under the GPL v3 license (see http://extjs.com/license).
 */

/*global console: true */
(function() {
   "use strict"; //$NON-NLS-1$

   /**
    * An appender that uses native browser functions or Ext.log to send 
    * data to the browser console.
    * 
    * The root logger has this singleton attached, so that all logging
    * operations will go by default to the browser console, like this:
    * 
    * {@img log-browser-console.png alt text}
    */
   Ext.define('Sm.log.ExtLogAppender', { //$NON-NLS-1$
      extend: 'Sm.log.AppenderBase',
      
      singleton : true,
      
      uses : ['Sm.log.util.Assert',
              'Sm.log.Level'],
      
      /**
       * @protected
       * @inheritDoc
       */
      doLog : function(logEvent) {
         var extLevel = null, 
             textMessage,
             extMessage,
             loggedObject = logEvent.loggedObject,
             consoleArgs;
         
         textMessage =  this.formatLogAsText(logEvent);
         consoleArgs = [textMessage];
         if( loggedObject) {
            consoleArgs.push(loggedObject);
         }
         
         Sm.log.util.Assert.assert(logEvent);
         switch( logEvent.level) {
            case Sm.log.Level.NONE.getName():
            case Sm.log.Level.ALL.getName():
               Sm.log.util.Debug.abort( "We should never arrive here");
               break;
            case Sm.log.Level.FATAL.getName():
            case Sm.log.Level.ERROR.getName():
               if( window.console && console.error  && 
                        Ext.isFunction(console.error)) {
                  console.error.apply(console, consoleArgs);
                  return;
               }
               extLevel = "error";
               break;
            case Sm.log.Level.WARN.getName():
               if( window.console && console.warn  && 
                        Ext.isFunction(console.warn)) {
                  console.warn.apply(console, consoleArgs);
                  return;
               }
               extLevel = "warn";
               break;
            case Sm.log.Level.INFO.getName():
               if( window.console && console.info  && 
                        Ext.isFunction(console.info)) {
                  console.info.apply(console, consoleArgs);
                  return;
               }
               extLevel = "info";
               break;
            default:
               if( window.console && console.log && 
                        Ext.isFunction(console.log)) {
                  console.log.apply(console, consoleArgs);
                  return;
               }
               extLevel = "log";
               break;
         }
         extMessage = {msg : textMessage, level: extLevel};
         if( loggedObject ) {
            extMessage.dump = loggedObject;
         }
         Ext.log(extMessage);
      }
   });

}());