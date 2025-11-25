export type UploadResult = { status: number; json: any };

export function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    try {
      console.log('[uploadWithProgress] Starting upload to:', url);
      console.log('[uploadWithProgress] FormData entries:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.type}, ${value.size} bytes)`);
        } else {
          console.log(`  ${key}:`, value);
        }
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      // Include cookies for same-origin auth routes
      xhr.withCredentials = true;

      xhr.upload.onprogress = (event: ProgressEvent<EventTarget>) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          console.log('[uploadWithProgress] Response received:', {
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText.substring(0, 500)
          });
          let parsed: any = null;
          try { 
            parsed = JSON.parse(xhr.responseText); 
            console.log('[uploadWithProgress] Parsed response:', parsed);
          } catch (e) {
            console.error('[uploadWithProgress] Failed to parse response:', e);
          }
          resolve({ status: xhr.status, json: parsed });
        }
      };

      xhr.onerror = () => {
        console.error('[uploadWithProgress] XHR network error');
        reject(new Error('Network error while uploading'));
      };
      
      console.log('[uploadWithProgress] Sending request...');
      xhr.send(formData);
    } catch (e) {
      console.error('[uploadWithProgress] Exception:', e);
      reject(e);
    }
  });
}
