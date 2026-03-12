<script lang="ts">
    import { usePasskeyRegister } from "../../src/adapters/svelte.svelte";

    interface Props {
        routes: { options: string; submit: string };
        onSuccess?: () => void;
        onError?: (error: Error) => void;
    }

    const props: Props = $props();
    const passkey = usePasskeyRegister(props);
</script>

<div>
    <span data-testid="loading">{passkey.isLoading}</span>
    <span data-testid="error">{passkey.error ?? ""}</span>
    <span data-testid="supported">{passkey.isSupported}</span>
    <button data-testid="register" onclick={() => passkey.register("My Device")}>Register</button>
</div>
