## RESPONSE STRUCTURE
*Success*
{
    data: any
}

*Error*
{
    message: string,
    data: {
        error: any
        ...
    }
}