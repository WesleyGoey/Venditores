<?php

namespace App\Http\Requests;

use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Gate;

/**
 * A vendor account listing one of its own vendors. Same fields as the admin's form.
 */
class OwnVendorRequest extends RecommendedVendorRequest
{
    public function authorize(): Response
    {
        return Gate::inspect('own-vendors');
    }
}
