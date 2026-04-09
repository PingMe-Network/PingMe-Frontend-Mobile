import React, { useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error: any) => void;
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  siteKey,
  onVerify,
  onExpire,
  onError,
}) => {
  const webViewRef = useRef<WebView>(null);

  // HTML content with Turnstile widget
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: transparent;
          }
        </style>
      </head>
      <body>
        <div 
          class="cf-turnstile" 
          data-sitekey="${siteKey}" 
          data-callback="onSuccess" 
          data-expired-callback="onExpired" 
          data-error-callback="onError"
          data-theme="dark"
        ></div>

        <script>
          function onSuccess(token) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', token: token }));
          }
          function onExpired() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'expired' }));
          }
          function onError(err) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: err }));
          }
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent, baseUrl: 'https://pingme.click' }}
        style={styles.webview}
        scrollEnabled={false}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'success') {
              onVerify(data.token);
            } else if (data.type === 'expired') {
              onExpire?.();
            } else if (data.type === 'error') {
              onError?.(data.error);
            }
          } catch (e) {
            console.error('Failed to parse message from WebView', e);
          }
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        incognito={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 100,
    width: '100%',
    marginVertical: 10,
    overflow: 'hidden',
  },
  webview: {
    backgroundColor: 'transparent',
    height: 100,
  },
});
