<?php

namespace App\Http\Requests;

use App\Enums\ProcurementStatus;
use Illuminate\Auth\Access\Response;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreVendorNeedRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): Response
    {
        return Gate::inspect('update', $this->route('event'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'category' => ['required', 'string', 'max:255'],
            'specification' => ['nullable', 'string', 'max:5000'],
            'allocated_budget' => ['required', 'integer', 'min:0', 'max:'.StoreEventRequest::MAX_BUDGET],
            'is_vital' => ['boolean'],
            'procurement_status' => ['sometimes', Rule::enum(ProcurementStatus::class)],
        ];
    }
}
