<script lang="ts">
    import { usePasskeyVerify } from "../../src/adapters/svelte";

    interface Props {
        routes: { options: string; submit: string };
        onSuccess?: (response: { redirect?: string }) => void;
        onError?: (error: Error) => void;
    }

    const props: Props = $props();
    const passkey = usePasskeyVerify(props);
</script>

<div>
    <span data-testid="loading">{passkey.isLoading}</span>
    <span data-testid="error">{passkey.error ?? ""}</span>
    <span data-testid="supported">{passkey.isSupported}</span>
    <button data-testid="verify" onclick={() => passkey.verify()}>Verify</button>
</div>
