import { useEffect } from 'react';
import {EventType, useRive, useStateMachineInput} from "@rive-app/react-canvas";
// @ts-ignore
import riveFile from  '../vehicles.riv';

export default function Simple() {
    const { rive, RiveComponent } = useRive({
        src: riveFile,
        stateMachines: "bumpy",
        autoplay: true,
        // We can pass the call back to the `useRive` hook
        onStateChange: (event) => {
            // @ts-ignore
            console.log(event.data[0]);
        }
    });

    const bumpInput = useStateMachineInput(rive, "bumpy", "bump");

    // We can also pass the callback to the rive object once it has loaded.
    // NOTE: If you pass the callback to the rive object, you do not need to
    // pass it to the useRive hook as well, and vice versa.
    useEffect(() => {
        if (rive) {
            rive.on('statechange' as EventType, (event) => {
                // @ts-ignore
                console.log(event.data[0]);
            });
        }
    }, [rive]);

    return (
        <RiveComponent
            style={{ height: "100px" }}
            onClick={() => bumpInput && bumpInput.fire()}
        />
    );
}