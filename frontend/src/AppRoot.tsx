import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import GlobalCallNotification from './components/webrtc/GlobalCallNotification';

export default function AppRoot() {
  return (
    <>
      <RouterProvider router={router} />
      <GlobalCallNotification />
    </>
  );
}