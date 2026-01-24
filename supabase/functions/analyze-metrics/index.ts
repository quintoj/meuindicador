import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { niche, metrics } = await req.json()
        const openAiKey = Deno.env.get("OPENAI_API_KEY")

        if (!openAiKey) {
            console.error("API KEY NOT FOUND");
            return new Response(
                JSON.stringify({ error: 'OPENAI_API_KEY is not set' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `Você é um consultor analítico. Analise os números reais enviados no JSON abaixo.
                        
                        Contexto do Nicho: ${niche}
                        
                        Instruções de Análise:
                        1. Cite os valores numéricos EXATOS na sua resposta para provar que você analisou os dados (Ex: "Seu faturamento de R$ 50.000...").
                        2. Se o valor estiver longe da meta, seja firme no diagnóstico.
                        3. Use o formato abaixo:
                        
                        🎯 O Diagnóstico: (Análise crua dos números).
                        💡 Ação Prática: (O que fazer).
                        🚀 Visão de Crescimento: (Incentivo).`
                    },
                    {
                        role: 'user',
                        content: `Dados JSON: ${metrics}`
                    }
                ],
                temperature: 0.7,
            }),
        })

        const data = await response.json()

        if (data.error) {
            console.error('OpenAI API error:', data.error)
            throw new Error(data.error.message || 'OpenAI API error')
        }

        const analysis = data.choices[0].message.content

        return new Response(
            JSON.stringify({ analysis }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Error in analyze-metrics function:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
